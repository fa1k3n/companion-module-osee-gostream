
import { create } from './state'
import { disconnectSocket, connect, sendCommand, sendCommands, GoStreamCmd } from './connection'
import { ReqType } from './enums'
import { GoStreamInstance } from './index'
import {
	TCPHelper,
} from '@companion-module/base'

type InputT = { input?: number }
type FadeToBlackT = {
	rate?: number
	afv?: boolean
	enable?: boolean
}

export type MixEffectStateT = {
	Program: InputT
	Preview: InputT
	FadeToBlack: FadeToBlackT
}

/*
<MixEffectBlocks>
	<MixEffectBlock index="0" >
		<Program input="2" />
		<Preview input="0" />
		<NextTransition selection="BKGD" nextSelection = "BKGD" />
		<TransitionStyle style="Mix" nextStyle = "Mix" previewTransition = "false" >
			<MixParameters rate="1" />
			<DipParameters rate="1" input = "4" />
			<WipeParameters rate="1" pattern = "0" symmetry = "50" xPosition = "0" yPosition = "0" reverseDirection = "false" softness = "0" border = "0" fillSource = "8" />
		</TransitionStyle>
		< Keys >
			<Key index="0" type = "LUMA" onAir = "false" />
			<LumaParameters fillSource="0" keySource = "0" maskEnable = "false" maskHStart = "0" maskVStart = "0" maskHEnd = "100" maskVEnd = "100" shapedKey = "false" clip = "23" gain = "32" invert = "false" resize = "false" size = "0.50" xPosition = "-7" yPosition = "0" />
			<ChromaParameters fillSource="2" maskEnable = "false" maskHStart = "0" maskVStart = "0" maskHEnd = "100" maskVEnd = "100" resize = "false" size = "0.50" xPosition = "-6.4" yPosition = "3.8" smpXPosition = "7.8" smpYPosition = "-3" sample = "false" y = "0" cb = "128" cr = "128" foreground = "0" background = "0" keyEdge = "0" />
			<PatternParameters fillSource="3" pattern = "8" wipeSize = "100" wipeXPosition = "0" wipeYPosition = "0" wipeSymmetry = "50" wipeSoftness = "0" maskEnable = "false" maskHStart = "0" maskVStart = "0" maskHEnd = "100" maskVEnd = "100" resize = "false" size = "0.25" xPosition = "0.2" yPosition = "0" />
			<PIPParameters fillSource="2" size = "0.25" xPosition = "-2.6" yPosition = "-1.8" maskEnable = "false" maskHStart = "0" maskVStart = "0" maskHEnd = "100" maskVEnd = "100" borderEnable = "false" borderWidth = "0" borderColorHue = "190" borderColorSaturation = "100" borderColorBrightness = "100" />
		</Keys>
		< FadeToBlack rate = "1" afv = "true" enable = "false" />
	</MixEffectBlock>
< /MixEffectBlocks>
*/
class MixEffectBlock {
	state: MixEffectStateT
	constructor() {
		this.state = {
			Program: { input: 0 },
			Preview: { input: 0 },
			FadeToBlack: { rate: 0, afv: false, enable: false },
		} 

		const cmds: GoStreamCmd[] = [
			{ id: 'keyOnAir', type: ReqType.Get },
			{ id: 'dskOnAir', type: ReqType.Get },
			{ id: 'pgmIndex', type: ReqType.Get },
			{ id: 'pvwIndex', type: ReqType.Get },
			{ id: 'autoTransition', type: ReqType.Get },
			{ id: 'prev', type: ReqType.Get },
			{ id: 'ftb', type: ReqType.Get },
			{ id: 'ftbRate', type: ReqType.Get },
			{ id: 'ftbAudioAFV', type: ReqType.Get },
			{ id: 'transitionIndex', type: ReqType.Get },
			{ id: 'transitionSource', type: ReqType.Get },
		]

		sendCommands(cmds).then((ret) => { return ret })
		return 
	}

	handleCommand(data: GoStreamCmd) {
		if (!data.value) return false
		switch (data.id as string) {
			case 'pgmIndex':
				this.state.Program.input = data.value[0]
				console.log("this.state.pgm", this.state.Program.input)
				break
			case 'pvwIndex':
				this.state.Preview.input = data.value[0]
				console.log("this.state.pvw", this.state.Preview.input)
				break
			case 'ftbAudioAFV':
				this.state.FadeToBlack.afv = data.value[0] === 1 ? true : false
				console.log("this.state.ftbAFV", this.state.FadeToBlack.afv)
				break
		}
		return false
	}

	set Program(para: InputT) {
		sendCommand('pgmIndex', ReqType.Set, [para.input])
	}
	get Program(): InputT {
		return this.state.Program
	}

	set Preview(para: InputT) {
		sendCommand('pvwIndex', ReqType.Set, [para.input])
	}
	get Preview(): InputT {
		return this.state.Preview
	}

	Cut() {
		sendCommand('cutTransition', ReqType.Set)
	}

	Auto() {
		sendCommand('autoTransition', ReqType.Set)
	}

	FTB() {
		sendCommand('ftb', ReqType.Set)
	}

	set FadeToBlack(para: FadeToBlackT) {
		// Just handle afv now
		sendCommand('ftbAudioAFV', ReqType.Set, [para.afv ? 1 : 0])
	}

	get FadeToBlack(): FadeToBlackT {
		return this.state.FadeToBlack
	}
}
export class GoStream {
	instance
	connection: TCPHelper | null
	mixEffectBlock: MixEffectBlock 
	constructor(instance: GoStreamInstance) {
		this.instance = instance
		this.instance.states = create(instance.model)
		this.connection = null
		this.connect()

		this.mixEffectBlock = new MixEffectBlock()
		console.log('Initializing connection')
	
	}

	connect(): void {
		connect(this.instance)
	}
	disconnectSocket(): void {
		disconnectSocket()
	}

	handleCommands(data: GoStreamCmd[]): void {
		data.forEach((cmd) => {
			this.mixEffectBlock.handleCommand(cmd)
		})
	}
}
