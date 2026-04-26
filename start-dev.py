#!/usr/bin/env python3
import subprocess, signal, os, sys, time, threading

os.chdir('/home/z/my-project')

# Ignore SIGPIPE in the parent
signal.signal(signal.SIGPIPE, signal.SIG_IGN)

proc = subprocess.Popen(
    ['node', 'node_modules/.bin/next', 'dev', '-p', '3000'],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    preexec_fn=lambda: signal.signal(signal.SIGPIPE, signal.SIG_IGN)
)

# Log output
def reader():
    with open('/home/z/my-project/dev.log', 'w') as log:
        for line in iter(proc.stdout.readline, b''):
            decoded = line.decode(errors='replace')
            print(decoded, end='', flush=True)
            log.write(decoded)
            log.flush()

t = threading.Thread(target=reader, daemon=True)
t.start()

# Wait for process
try:
    proc.wait()
except KeyboardInterrupt:
    proc.terminate()
