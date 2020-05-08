"""All the routes in the Horis application."""

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
        """
        Returns the index page for the Horis application.

        :param request: The HTTP request
        """
        return templates.TemplateResponse("index.html", {"request": request,})

    async def post(self, request):
        """
        Creates a prediction based on the race that the user inputted.

        :param request: The HTTP request
        """
        data = await request.json()
        # Generate predictions
        response_data = await generate_predictions(data)
        # Send the generated results
        return UJSONResponse(response_data)


async def complete_horses(request):
    """
    Auto-completes the horse names as the user enters a name.
    This route isn't accessed directly by the user, but is
    used by JavaScript to auto-complete for horses.

    :param request: The HTTP request
    """

    # Get the query
    q: str = request.query_params.get("q", None)
    if q is None:
        # User didn't give a query
        return UJSONResponse({"error": "You didn't specify a query."}, status_code=400)

    # Get the limit of horses
    try:
        limit: int = int(request.query_params.get("limit", 10))
    except ValueError:
        # Default limit of 10 horses
        limit = 10

    # Clamp the limit (minimum 1 horse, maximum 100 horse)
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
        # Fetch the first word of the horse name and age
        name_prefix = row[0].split(" ", 1)[0]
        age = DIGITS.match(row[1])

        # If the horse has an invalid age value in the database, skip it
        if age is None:
            print("WARNING, skipping", row[0], "because of invalid age")
            continue

        result.append(["{},{}".format(name_prefix, age.group(0)), row[0], age.group(0)])

    # Return a response
    return UJSONResponse(result)
