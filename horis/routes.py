from starlette.endpoints import HTTPEndpoint
from starlette.responses import UJSONResponse
from sqlalchemy import select
import re

from horis.app import templates, database
from horis.tables import horses
from horis.prediction import generate_predictions


DIGITS = re.compile("^\d+")


class IndexEndpoint(HTTPEndpoint):
    async def get(self, request):
        return templates.TemplateResponse("index.html", {"request": request,})

    async def post(self, request):
        data = await request.json()
        response_data = await generate_predictions(data)
        return UJSONResponse(response_data)


async def complete_horses(request):
    # Get the query
    q: str = request.query_params.get("q", None)
    if q is None:
        return UJSONResponse({"error": "You didn't specify a query."}, status_code=400)

    # Get the limit of horses
    try:
        limit: int = int(request.query_params.get("limit", 10))
    except ValueError:
        limit = 10

    # Clamp the limit
    limit = max(1, min(100, limit))

    # Make the query
    query = (
        select([horses.c.name, horses.c.age])
        .where(horses.c.name.ilike(q + "%"))
        .order_by(horses.c.name)
        .limit(limit)
    )

    # Fetch it all
    result = []
    async for row in database.iterate(query):
        name_prefix = row[0].split(" ", 1)[0]
        age = DIGITS.match(row[1])
        if age is None:
            print("WARNING, skipping", row[0], "because of invalid age")
            continue

        result.append(["{},{}".format(name_prefix, age.group(0)), row[0], age.group(0)])

    # Return a response
    return UJSONResponse(result)
