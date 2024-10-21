from flask import Flask, Response, stream_with_context
from flask_cors import CORS,cross_origin
import asyncio
import aiohttp
import json
import random
import time


app = Flask(__name__)

CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000"]}})

TOTAL_REQUESTS = 5000            
CONCURRENT_REQUESTS = 100        
STREAM_INTERVAL = 5             

with open('data.json', 'r') as file:
    pokemon_data = json.load(file)

def get_random_pokemon_name():
    """
    Fetch a random Pokémon name from the preloaded data.

    Returns:
        str: The name of the Pokémon in French.
    """
    random_id = random.randint(1, len(pokemon_data) - 1)  
    return pokemon_data[random_id]['name']['french']      
async def fetch_dummy_data(session: aiohttp.ClientSession, request_id: int) -> dict:
    """
    Simulate an asynchronous network call to fetch dummy data related to Pokémon sales.

    Args:
        session (aiohttp.ClientSession): The HTTP session to use for the request.
        request_id (int): The unique identifier for the simulated request.

    Returns:
        dict: A dictionary containing dummy data including Pokémon name, listing price (release price), and current price.
    """
    await asyncio.sleep(0.005)  
    return {
        "id": request_id,
        "name": get_random_pokemon_name(),                   
        "listingPrice": random.randint(1, 3000),            
        "currentPrice": random.randint(400, 4000),         
    }

async def fetch_all_dummy_data() -> list:
    """
    Fetches dummy data concurrently using asynchronous tasks.

    Returns:
        list: A list of dictionaries representing the fetched dummy data.
    """
    tasks = []
    
    async with aiohttp.ClientSession() as session:
        for i in range(1, TOTAL_REQUESTS + 1):
            task = asyncio.create_task(fetch_dummy_data(session, i))  
            tasks.append(task)
            
            if len(tasks) >= CONCURRENT_REQUESTS:
                done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                tasks = list(pending)
        
        if tasks:
            results = await asyncio.gather(*tasks)
        else:
            results = []
    return results



@app.route('/stream-data', methods=['GET', 'OPTIONS'])
@cross_origin(origins=["http://localhost:3000","*"], supports_credentials=True)
def stream_data():
    """
    Stream dummy Pokémon data as Server-Sent Events (SSE).

    The endpoint continuously sends Pokémon data to the client, simulating real-time updates.

    Returns:
        Response: A streaming response with event data in text/event-stream format.
    """
    
    def event_stream():
        """
        Generate and stream data to the client. The data is sent as Server-Sent Events (SSE).

        Yields:
            str: JSON-formatted dummy data for each Pokémon.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            # Fetch all dummy data asynchronously
            all_data = loop.run_until_complete(fetch_all_dummy_data())
            #filtered_data_profitable = [item for item in all_data if item['currentPrice'] - item['listingPrice'] > 0]
            #filtered_data_non_profitable = [item for item in all_data if item['currentPrice'] - item['listingPrice'] <= 0]

            for item in all_data: 
                app.logger.info(json.dumps(item)) 
                yield f"data:{json.dumps(item)}\n\n" 

                time.sleep(0.02)
        except GeneratorExit:
            app.logger.info("Client disconnected from stream.")
        finally:
            loop.close()

    response = Response(stream_with_context(event_stream()), mimetype="text/event-stream")
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Connection'] = 'keep-alive'
    return response

if __name__ == '__main__':
    app.run(port=5000, debug=True, threaded=True)
