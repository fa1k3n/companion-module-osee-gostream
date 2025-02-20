//import { variables } from './variables'
//import { feedbacks } from './feedbacks'
//import { presets } from './presets'
import { create } from './state'
import { disconnectSocket, connect, sendCommand, sendCommands, GoStreamCmd } from './connection'
import { ReqType } from './enums'
import { GoStreamInstance } from './index'
import {
//	CompanionFeedbackDefinitions,
//	CompanionPresetDefinitions,
//	CompanionVariableDefinition,
	TCPHelper,
} from '@companion-module/base'

export type MixEffectStateT = {
	pgm: number
	pvw: number
	ftbAFV: boolean
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
			pgm: 0,
			pvw: 0,
			ftbAFV: false
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
				this.state.pgm = data.value[0]
				console.log("this.state.pgm", this.state.pgm)
				break
			case 'pvwIndex':
				this.state.pvw = data.value[0]
				console.log("this.state.pvw", this.state.pvw)
				break
			case 'ftbAudioAFV':
				this.state.ftbAFV = data.value[0] === 1 ? true : false
				console.log("this.state.ftbAFV", this.state.ftbAFV)
				break
		}
		return false
	}

	Program(input?: number): boolean | number {
		if (arguments.length === 0) {
			return this.state.pgm
		}
		sendCommand('pgmIndex', ReqType.Set, [input])
		return true
	}

	Preview(input?: number): boolean | number {
		if (arguments.length === 0) {
			return this.state.pvw
		}
		sendCommand('pvwIndex', ReqType.Set, [input])
		return true
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

	FadeToBlack(_rate?: number, afv?: boolean, _enable?: boolean): { rate: number, afv: boolean, enable: boolean } | boolean {
		if (arguments.length === 0) {
			return {
				rate: 0, afv: this.state.ftbAFV, enable: false
			}
		}
		// Just handle afv now
		sendCommand('ftbAudioAFV', ReqType.Set, [afv ? 1 : 0])
		return false
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
