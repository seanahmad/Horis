## Horis

_Horse + Iris_

Horis is a web application which allows you to predict horse racing results.
When you enter a list of horses with their positions, Horis will return
a sorted list of results to the user.

Under the hood, it uses `scikit-learn` SVR models to approximate a placement
for each horse.

**NOTE:** Horis only predicts results, and the prediction is not perfect.
You should probably not use this application for your real predictions
in horse races.

## Requirements

- MacOS/Linux for the server
- Python 3.6+
  - Python requirements are in `requirements.txt`
- SQLite 3
- Node.js for front-end compilation
- Horses database and trained SVR, from [TJK-Scraper](https://github.com/Horse-Race-Prediction-System/TJK-Scraper)

## Installation

1. Clone the repository.
2. Create a new virtualenv: `virtualenv env`

- NOTE: you might need to install the virtualenv package from your
  distribution's packages. It's usually listed as `python3-virtualenv`.

3. Activate the virtualenv: `source env/bin/activate`
4. Install the required packages: `pip install -r requirements.txt`
5. Install the Node.js requirements: `yarn` or `npm i`

## Running

1. Compile the webpack assets: `yarn build`
2. Start the server: `uvicorn horis.app:app`

- NOTE: you will need a web server such as Nginx if you're using this in
  production. You also need to be in the virtualenv when the server is running.

## Usage

When you open the front-page of Horis, you will be greeted with a
page which will ask you to fill out a table, with one row for each horse.
Select each horse from the dropdown that is presented to you, and fill out
the rest of the columns. After you fill out all the rows, press "Submit".
Horis will predict the results of the race and return the rankings back to you.

## Copyright

&copy; 2020 Efe Mert Demir. This software is licensed under the BSD 3-Clause License.
