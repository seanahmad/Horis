"""Defines the main application entrypoint for Horis."""

from starlette.applications import Starlette
from starlette.templating import Jinja2Templates
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles
from databases import Database

from horis import config

# Setup templating
templates = Jinja2Templates("templates")

# Setup database
database = Database(config.HORSES_DB_URL)

# Setup routes
from horis import (
    routes as rs,
)  # noqa # has to be here because routes use templates & database

# Routes listing
routes = [
    Route("/", rs.IndexEndpoint, name="index"),
    Route("/horses.json", rs.complete_horses, name="complete_horses"),
    Mount("/static", app=StaticFiles(directory="static"), name="static"),
]

# Setup the application
app = Starlette(
    debug=config.DEBUG,
    routes=routes,
    on_startup=[database.connect],
    on_shutdown=[database.disconnect],
)
