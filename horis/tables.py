"""Database tables used in Horis."""

from sqlalchemy import MetaData, Table, Column, types

# The SQLAlchemy metadata, which holds information about all tables.
metadata = MetaData()

### The Horses Table
#
# The horses table holds all the horses that are recognized by Horis
# (and the SVR model used by Horis).
horses = Table(
    "horses",
    metadata,
    # The full name of the horse.
    Column("name", types.String(75), primary_key=True),
    # The age of the horse. Is updated for the current year.
    Column("age", types.String(30), primary_key=True),
    # The origin country of the horse.
    Column("country", types.String(50), nullable=False),
    # The breed of the horse.
    Column("breed", types.String(30), nullable=False),
    # The name of the horse's father, which is also available in the database.
    Column("father", types.String(75), nullable=False),
    # The name of the horse's mother, which is also available in the database.
    Column("mother", types.String(75), nullable=False),
    # The total amount of races this horse has run.
    Column("races", types.Integer, nullable=False),
    # The amount of races this horse came in first place.
    Column("first", types.Integer, nullable=False),
    # The amount of races this horse came in second place.
    Column("second", types.Integer, nullable=False),
    # The amount of races this horse came in third place.
    Column("third", types.Integer, nullable=False),
    # The amount of races this horse came in fourth place.
    Column("fourth", types.Integer, nullable=False),
    # The percentage of races this horse came in first place.
    Column("first_percent", types.Integer, nullable=False),
    # The percentage of races this horse came in second place.
    Column("second_percent", types.Integer, nullable=False),
    # The percentage of races this horse came in third place.
    Column("third_percent", types.Integer, nullable=False),
    # The percentage of races this horse came in fourth place.
    Column("fourth_percent", types.Integer, nullable=False),
    # The amount of money this horse has earned for its owner in its lifetime.
    Column("earnings", types.REAL),
)
