from app import create_app
from dotenv import load_dotenv

import subprocess
import sys
import os
import atexit

load_dotenv()
app = create_app()

if __name__ == '__main__':
    # Only launch the simulator once (prevent werkzeug reloader from launching it twice)
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
        simulator_process = subprocess.Popen([sys.executable, 'channel_simulator.py'])
        
        def cleanup():
            simulator_process.terminate()
            simulator_process.wait()
        
        atexit.register(cleanup)
        
    app.run(debug=True, port=5000, use_reloader=False)
