import os

def main():
    files = os.listdir('./frames')

    for file in files:
        gcloud_command = f"gcloud compute scp ./frames/{file} bot-grande-familia:/home/nandoaqws/bsky-bot/frames"
        print("Uploading file: ", file)
        os.system(gcloud_command)
        print("Removing file: ", file)
        os.remove("./frames/" + file)
        

if __name__ == "__main__":
    main()