import { DateTime } from "luxon"

export class Program {
    public id: string
    public station: string
    public title: string
    public from: number
    public to: number
    public duration: string
    public performer: string
    public info: string
    public image: string
    public url: string

    constructor(args: any) {
        this.id = args.id
        this.station = args.station
        this.title = args.title
        this.from = args.from
        this.to = args.to
        this.duration = args.duration
        this.performer = args.performer
        this.info = args.info
        this.image = args.image
        this.url = args.url
    }

    public recordingDuration() {
        return (this.to - Number(DateTime.local().toFormat("yyyyMMddHHmmss")))
    }

    public effectiveDate() {
        const _from = DateTime.fromFormat(this.from.toString(), "yyyyMMddHHmmss")
        const time = _from.hour < 5 ? _from.minus(24 * 60 * 60) : _from
        return time
    }
}