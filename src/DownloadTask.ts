export class DownloadTask {
    public async authenticate(): Promise<{token?: string, areaCode?: string}> {
        const res = await fetch("https://radiko.jp/apps/js/playerCommon.js?_=20171113")
        const text = await res.text()
    
        const found = text.match(/new RadikoJSPlayer\(.*?'pc_html5',\s*'(\w+)'/)
    
        if (found === null || found.length === 0) {
            console.error("retrieving auth_key from playerCommon.js failed")
            return {}
        }
    
        const authKey = found[1]
        
        const secondRes = await fetch("https://radiko.jp/v2/api/auth1", {
            headers: {
                "X-Radiko-App": "pc_html5",
                "X-Radiko-App-Version": "0.0.1",
                "X-Radiko-User": "dummy_user",
                "X-Radiko-Device": "pc"
            }
        })
    
        const secondText = await secondRes.text()
    
        const length = Number(secondRes.headers.get("x-radiko-keylength"))
        const offset = Number(secondRes.headers.get("x-radiko-keyoffset"))
        const token = secondRes.headers.get("x-radiko-authtoken")
        const partialKey = this.byteslice(Buffer.from(authKey), offset, length).toString('base64')
    
        if (token === null) {
            return {}
        }

        const authRes = await fetch("https://radiko.jp/v2/api/auth2", {
            headers: {
                "X-Radiko-User": "dummy_user",
                "X-Radiko-Device": "pc",
                "X-Radiko-Authtoken":  token as string,
                "X-Radiko-Partialkey": partialKey as string,
            }
        })
    
        const authText = await authRes.text()
        const authCodes = authText.split(",")
    
        if (authCodes.length <= 1) {
            console.error("auth2 failed. Outside Japan?")
            return {}
        }   
    
        return {token, areaCode: authCodes[0]}
    }

    private byteslice(buffer: Buffer, start: number, length: number) {
        return buffer.slice(start, start + length);
    }
}