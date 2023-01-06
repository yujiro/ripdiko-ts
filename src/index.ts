import { DownloadTask } from "./DownloadTask"

const run = async () => {
    const {token, areaCode} = await new DownloadTask().authenticate()
    console.log({token, areaCode})
}

run().then((res) => {
    console.log({res})
})


