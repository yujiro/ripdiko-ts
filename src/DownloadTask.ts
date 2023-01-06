import {JSDOM} from "jsdom"
import {DateTime} from "luxon"
import { Program } from "./Program"

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

    public async nowPlaying(station: string, areaCode: string): Promise<Program | null> {
        const res = await fetch(`https://radiko.jp/v3/program/now/${areaCode}.xml`)
        const xml = await res.text()
        const jsdom = new JSDOM()
        const parser = new jsdom.window.DOMParser();
        const doc = parser.parseFromString(xml, "text/xml")
        const now = Number(DateTime.local().toFormat("yyyyMMddHHmmss"))
        let program = null

        doc.querySelectorAll(`station[id="${station}"] prog`).forEach((prog) => {
            const from = Number(prog.getAttribute("ft"))
            const to = Number(prog.getAttribute("to"))

            if (from <= now && now < to) {
                program = new Program({
                    id: `${prog.getAttribute("ft")}-${station}`,
                    station: this.val(doc, "name"),
                    title: this.val(prog, "title"),
                    from,
                    to,
                    duration: Number(prog.getAttribute("dur")),
                    performer: this.val(prog, "pfm"),
                    info: this.val(prog, "info"),
                    image: this.val(prog, "img"),
                    url: this.val(prog, "url"),
                })
            }
        })

        return program
    }

    private val(node: Document | Element, tagName: string) {
        const elem = node.querySelector(tagName)

        if (elem) {
            return elem.textContent
        }
        
        return ""
    }

    private byteslice(buffer: Buffer, start: number, length: number) {
        return buffer.slice(start, start + length);
    }
}