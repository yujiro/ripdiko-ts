import { DownloadTask } from "./DownloadTask"

const run = async () => {
    const {token, areaCode} = await new DownloadTask().authenticate()
    const a = await new DownloadTask().nowPlaying("TBS", areaCode as string)
}

run().then((res) => {
    console.log({res})
})


