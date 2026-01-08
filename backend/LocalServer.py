import socket
import threading

listenAll = "0.0.0.0"
portToUse = 2312

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((listenAll, portToUse))
server.listen(1)


print(f"Listening on port {listenAll}...")
conn, clientIP = server.accept()
print("Connected by", clientIP)

def receive_messages(conn):
    while True:
        try:
            msg = conn.recv(1024).decode()
            if not msg:
                print("Client disconnected")
                break
            print("\nClient:", msg)
        except:
            print("Connection closed")
            break

# Start the receiving thread
threading.Thread(target=receive_messages, args=(conn,), daemon=True).start()

# Main thread handles sending
while True:
    reply = input("You: ")
    conn.send(reply.encode())
    if reply.upper() == "CLOSE": 
        break

conn.close()
server.close()
print("Server closed")