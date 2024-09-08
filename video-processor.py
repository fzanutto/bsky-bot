from ffmpeg import FFmpeg, Progress
import os


def reduce_fps(new_fps, input_file, output_file):
    # ffmpeg -i input.mp4 -r 3 output.mp4
    ffmpeg = (
        FFmpeg()
        .input(input_file)
        .output(
            output_file,
            {"r": new_fps},
        )
    )

    @ffmpeg.on("progress")
    def on_progress(progress: Progress):
        print("\rReduzindo FPS -", progress.time, "       ", end="")

    ffmpeg.execute()


def extract_frames(input_file, output_file):
    # ffmpeg -r 1 -i input.mp4 -r 1 "output_%04d.jpg"
    ffmpeg = (
        FFmpeg()
        .input(input_file, {"r": "1"},)
        .output(
            output_file,
            {"r": "1"},
        )
    )

    @ffmpeg.on("progress")
    def on_progress(progress: Progress):
        print("\rExtraindo frames -", progress.time, "       ", end="")
    
    ffmpeg.execute()

def main():
    files = os.listdir('./videos')

    for file in files:
        # remove temp output file if exists
        if os.path.exists("./videos/" + "output.mp4"):
            os.remove("./videos/" + "output.mp4")

        season_episode = file.split('.')[3]

        print(season_episode)
        reduce_fps(3, "./videos/" + file, "./videos/output.mp4")
        print()
        extract_frames("./videos/output.mp4", "./frames/" + season_episode + "_%04d.jpg")
        print()

        # delete original file
        os.remove("./videos/" + file)
        


if __name__ == "__main__":
    main()