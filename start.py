#!/usr/bin/env python3
"""Start Next.js dev server with SIGPIPE protection"""
import subprocess, signal, os, sys, time, threading

os.chdir('/home/z/my-project')
signal.signal(signal.SIGPIPE, signal.SIG_IGN)

def start_server():
    env = os.environ.copy()
    env['NODE_ENV'] = 'production'
    env['HOSTNAME'] = '0.0.0.0'
    env['PORT'] = '3000'
    
    proc = subprocess.Popen(
        ['node', '.next/standalone/server.js'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=env,
        preexec_fn=lambda: signal.signal(signal.SIGPIPE, signal.SIG_IGN)
    )
    
    def log_reader():
        with open('/home/z/my-project/dev.log', 'a') as log:
            for line in iter(proc.stdout.readline, b''):
                decoded = line.decode(errors='replace')
                sys.stdout.write(decoded)
                sys.stdout.flush()
                log.write(decoded)
                log.flush()
    
    t = threading.Thread(target=log_reader, daemon=True)
    t.start()
    
    return proc

proc = start_server()

# Keep running and restart if needed
while True:
    ret = proc.wait()
    now = time.strftime('%Y-%m-%d %H:%M:%S')
    with open('/home/z/my-project/dev.log', 'a') as log:
        log.write(f'\n[{now}] Server exited with code {ret}, restarting in 3s...\n')
    time.sleep(3)
    proc = start_server()
