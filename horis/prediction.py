"""Implements the prediction functions."""

from sklearn.svm import SVR
import pickle
import numpy
from sqlalchemy import and_

from horis.config import MODEL_FILE
from horis.app import database
from horis.tables import horses


# Cached model object. Lazily loaded on first prediction.
_model = None


def model() -> SVR:
    """Returns the model object. Lazily loads it if not loaded."""
    global _model

    if _model is None:
        _model = pickle.load(open(MODEL_FILE, "rb"))

    return _model


async def generate_predictions(data: list) -> list:
    """
    Generates predictions based on a list of horse data.

    :param data: The data sent in by the user. It is in the following form::

         [
             {
                id: string;
                weight: number;
                driver: string;
                start: number;
                wonLast: boolean;
                wonLastThree: boolean;
            },
            # more items...
         ]
    """

    # Holds the horses in the race.
    race = []
    # Holds the weights for each horse in the race.
    # Used later to calculate the average weight data point.
    weights = []

    # Query information about the horse and create a
    # data point array
    for horse in data:
        # Horses are selected by the first word of their name
        # and their age.
        name, age = horse["id"].split(",")

        # Fetch the horse from the database
        db_horse = await database.fetch_one(
            horses.select().where(
                and_(horses.c.name.ilike(name + "%"), horses.c.age.ilike(age + "%"))
            )
        )

        # Create the data points for the result prediction
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

        # Add the horse's weight to the list of weights
        weights.append(horse["weight"])
        # Add the horse to the race.
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
    # Set the average weight data point to 1 if the horse weighs
    # more than the average, -1 otherwise
    for horse, w in zip(race, weights):
        horse["data_points"][2] = 1 if w >= average else -1
        horse["data_points"] = numpy.array(horse["data_points"]).reshape(1, -1)

    # Fetch the SVR model.
    svr = model()

    # Predict the race results for each horse based on its data
    # points.
    for horse in race:
        horse["prediction"] = svr.predict(horse["data_points"])

    # Sort the horses by their results as predicted by the SVR
    # model.
    race.sort(key=lambda h: h["prediction"])

    # Generate output data to send to JavaScript
    return [
        {
            "name": h["name"],
            "age": h["age"],
            "driver": h["horse"]["driver"],
            "start": h["horse"]["start"],
            "prediction": h["prediction"][0],
        }
        for h in race
    ]
