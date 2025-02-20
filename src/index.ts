import { runEntrypoint, InstanceBase, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, Config } from './config'
import { GoStream } from './GoStream'
import { GetActionsList } from './actions'
import { GoStreamDuet } from './models/duet'
import { UpgradeScriptList } from './upgrades'
import { variables } from './variables'
import { feedbacks } from './feedbacks'
import { presets } from './presets'

//import { type IModelSpec } from './models/types'
//import { GetModelSpec, GetAutoDetectModel } from './models'
export class GoStreamInstance extends InstanceBase<Config> {
	config
	gostream
	states
	model
	async init(config: Config): Promise<void> {
		this.config = config
		this.model = new GoStreamDuet() //GetModelSpec(this.config.modelId) || GetAutoDetectModel()
		this.log('debug', 'Initializing module')
		this.updateStatus(InstanceStatus.Disconnected)
		this.saveConfig(this.config)
		this.gostream = new GoStream(this)
		//this.initConnection()
		this.init_variables()
		this.init_actions()
		this.init_feedbacks()
		this.init_presets()
		this.checkFeedbacks()
	}
	async destroy(): Promise<void> {
		this.gostream.disconnectSocket()
		this.updateStatus(InstanceStatus.Disconnected)
		this.log('debug', 'destroy ' + this.id)
	}

	public getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}
	async configUpdated(config: Config): Promise<void> {
		this.config = config
		this.gostream.disconnectSocket()
		this.updateStatus(InstanceStatus.Disconnected)
		this.gostream = new GoStream(this)
		this.init_variables()
		this.init_actions()
		this.init_feedbacks()
		this.init_presets()
		this.checkFeedbacks()
	}
	
	init_variables(): void {
		this.log('debug', 'Initializing variables')
		this.setVariableDefinitions(variables(this)) // this.gostream.getVariables(this))
	}
	init_actions(): void {
		this.log('debug', 'Initializing actions')
		this.setActionDefinitions(GetActionsList(this))
	}
	init_feedbacks(): void {
		this.log('debug', 'Initializing feedbacks')
		//this.setFeedbackDefinitions(this.gostream.getFeedbacks(this))
		this.setFeedbackDefinitions(feedbacks(this))
	}
	init_presets(): void {
		this.log('debug', 'Initializing presets')
		//this.setPresetDefinitions(this.gostream.getPresets(this))
		this.setPresetDefinitions(presets(this))
	}
}

runEntrypoint(GoStreamInstance, [...UpgradeScriptList])
