from sklearn.svm import SVR
import pickle
import numpy
from sqlalchemy import and_

from horis.config import MODEL_FILE
from horis.app import database
from horis.tables import horses


_model = None


def model() -> SVR:
    global _model

    if _model is None:
        _model = pickle.load(open(MODEL_FILE, "rb"))

    return _model


async def generate_predictions(data: list) -> list:
    race = []
    weights = []

    # Query information about the horse and create a
    # data point array
    for horse in data:
        name, age = horse["id"].split(",")

        db_horse = await database.fetch_one(
            horses.select().where(
                and_(horses.c.name.ilike(name + "%"), horses.c.age.ilike(age + "%"))
            )
        )

        data_points = [
            # Finish is always 0 because unknown
            0,
            # Start
            1 if 1 <= int(horse["start"]) <= 3 else 0,
            # Weight updated later
            None,
            # Successful
            1 if sum(map(int, db_horse[11:14])) > 50 else 0,
            # Experienced
            1 if int(db_horse[6]) > 5 else 0,
            # Can't check if the same driver is riding in a random race
            0,
            # Won its last race
            int(horse["wonLast"]),
            # Won its last 3 races
            int(horse["wonLastThree"]),
        ]

        weights.append(horse["weight"])
        race.append(
            {
                "horse": horse,
                "name": db_horse[0],
                "age": age,
                "data_points": data_points,
                "prediction": None,
            }
        )

    # Update the weight values
    average = sum(weights) / len(weights)
    for horse, w in zip(race, weights):
        horse["data_points"][2] = 1 if w >= average else -1
        horse["data_points"] = numpy.array(horse["data_points"]).reshape(1, -1)

    # Actual prediction
    svr = model()

    for horse in race:
        horse["prediction"] = svr.predict(horse["data_points"])

    race.sort(key=lambda h: h["prediction"])

    return list(
        map(
            lambda h: {
                "name": h["name"],
                "age": h["age"],
                "driver": h["horse"]["driver"],
                "start": h["horse"]["start"],
                "prediction": h["prediction"][0],
            },
            race,
        )
    )
