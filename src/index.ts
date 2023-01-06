import { execSync } from "child_process"
import { DateTime } from "luxon"
import { DownloadTask } from "./DownloadTask"

const run = async () => {
    const args = process.argv.slice(2)
    const {token, areaCode} = await new DownloadTask().authenticate()
    const station = args[0]
    const program = await new DownloadTask().nowPlaying(station, areaCode as string)
    
    if (program) {
        const duration = program.recordingDuration()
        const tempFile = `./temp/${program.id}.mp3`
        console.log(`Streaming ${program.title} ~ ${DateTime.fromFormat(program.to.toString(), "yyyyMMddHHmmss").toFormat("HH:mm")} (${duration}s)`)
        console.log(`Ripping audio file to ${tempFile}`)

        const stdout = execSync(`
            ffmpeg -loglevel error -fflags +discardcorrupt \
            -headers "X-Radiko-Authtoken: ${token}" \
            -i http://f-radiko.smartstream.ne.jp/${station}/_definst_/simul-stream.stream/playlist.m3u8 \
            -acodec libmp3lame -ar 44100 -ab 64k -ac 2 \
            -vn \
            -y \
            -t ${duration} \
            -metadata "author=${program.performer}" \
            -metadata "artist=${program.station}" \
            -metadata "title=${program.title} ${program.effectiveDate().toFormat("yyyy-MM-dd")}" \
            -metadata "album=${program.title}" \
            -metadata "genre=Radio" \
            -metadata "year=${program.effectiveDate().year}" \
            -f mp3 \
            ${tempFile} 
        `)
        console.log(stdout.toString())
    }
}

run().then((res) => {
    console.log({res})
})


