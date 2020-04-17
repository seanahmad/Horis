from sqlalchemy import MetaData, Table, Column, types


metadata = MetaData()


horses = Table(
    "horses",
    metadata,
    Column("name", types.String(75), primary_key=True),
    Column("age", types.String(30), primary_key=True),
    Column("country", types.String(50), nullable=False),
    Column("breed", types.String(30), nullable=False),
    Column("father", types.String(75), nullable=False),
    Column("mother", types.String(75), nullable=False),
    Column("races", types.Integer, nullable=False),
    Column("first", types.Integer, nullable=False),
    Column("second", types.Integer, nullable=False),
    Column("third", types.Integer, nullable=False),
    Column("fourth", types.Integer, nullable=False),
    Column("first_percent", types.Integer, nullable=False),
    Column("second_percent", types.Integer, nullable=False),
    Column("third_percent", types.Integer, nullable=False),
    Column("fourth_percent", types.Integer, nullable=False),
    Column("earnings", types.REAL),
)
