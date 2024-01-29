from flask import Flask, jsonify, make_response
from flask_cors import CORS
from flask_pymongo import PyMongo
from rymscraper import scraper
import logging

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb+srv://user:mypassword123@myatlasclusteredu.eiepfa0.mongodb.net/test"
mongo = PyMongo(app)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

logging.basicConfig(level=logging.DEBUG, 
                    format='%(message)s [in %(pathname)s:%(lineno)d]')

@app.route('/')
def hello():
    return "Hello, World!"

@app.route('/artists/<artist>')
def get_artist_info(artist):
    artist_collection = mongo.db.artists
    query_res = artist_collection.find_one({"name": artist})

    if query_res:
        artist_info = query_res['info']
    else:
        try:
            with scraper.Scraper() as rymscraper:
                artist_info = rymscraper.get_artist_info(artist)
                artist_collection.insert_one({'name': artist, 'info': artist_info})
        except Exception as e:
            print(f"Error occurred: {e}")
            response = make_response(jsonify({"error": "An error occurred while fetching artist information"}), 500)
            return response
    response = make_response(jsonify(artist_info))
    return response

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)