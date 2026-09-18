import type { Styles } from "jss"
import { el, mount, RedomComponent } from "redom"
import { AnimatedRectangleType, UIAnimatedRectangle } from "./uiAnimatedRectangle"
import { UIButton } from "./uiButton"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UISwitchGroup } from "./uiSwitchGroup"
import { UIText } from "./uiText"

enum CssClass
{
	uiRecordingState = `uiRecordingState`,
	uiRecordingStateMonitor = `uiRecordingStateMonitor`
}

export enum RecordingState
{
	notRecording = `Not recording`,
	recording = `Recording`
}

export interface UIRecordingStateHandler
{
	/**
	 * User clicked on button to view the audio source manager
	 * - buttons don't have link addresses
	 */
	gotoManageAudioSource: () => void
	/**
	 * User requests change to the current recording's recording state
	 */
	requestRecordingStateChange: ( state: RecordingState ) => void
}

export interface UIRecordingStateUpdateData
{
	volume?: number
	hasSource?: boolean
	recordingState?: RecordingState
}

export class UIRecordingState implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private currentRecordingState: RecordingState

	private recordingStates: RecordingState[]

	private recordingToggle: UISwitchGroup

	private audioManager: UIButton

	private noAudioWarning: UIText

	private sourceVolumeMonitor: UIAnimatedRectangle

	private topBlock: HTMLElement

	private hasSource: boolean

	constructor( private helper: UIMetaHelper, private handler: UIRecordingStateHandler )
	{
		this.id = `UIRecordingState`

		this.onRecordingSwitchClick = this.onRecordingSwitchClick.bind( this )

		this.hasSource = false

		this.currentRecordingState = RecordingState.notRecording

		this.recordingStates = Object.values( RecordingState )

		this.recordingToggle = new UISwitchGroup(
			this.helper,
			this.recordingStates,
			{
				onClick: this.onRecordingSwitchClick
			},
			[ 0 ],
			false
		)

		this.sourceVolumeMonitor = new UIAnimatedRectangle( this.helper, AnimatedRectangleType.gradient, 0, false )

		this.topBlock = el( `div`, [ this.recordingToggle, this.sourceVolumeMonitor ] )

		this.noAudioWarning = new UIText( this.helper, `No audio source, recording disabled.` )

		this.audioManager = new UIButton( this.helper, `Manage audio source`, { onClick: this.handler.gotoManageAudioSource } )

		this.el = el( `div`, [ this.noAudioWarning, this.audioManager ] )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiRecordingState )

		this.helper.setCss( this.sourceVolumeMonitor.el, this, CssClass.uiRecordingStateMonitor )
	}
	
	private onRecordingSwitchClick( index: number )
	{
		if ( this.recordingStates[ index ] === this.currentRecordingState ) return

		this.currentRecordingState = this.recordingStates[ index ] 

		this.recordingToggle.update( [ index ] )

		this.handler.requestRecordingStateChange( this.recordingStates[ index ] )
	}

	private toggleSourceAvailable()
	{
		this.hasSource = !this.hasSource

		if ( !this.hasSource )
		{
			// hide top block
			mount( this.el, this.noAudioWarning, this.topBlock, true )

			this.sourceVolumeMonitor.update( { isAnimated: false, value: 0 } )
		}
		else
		{
			// show top block
			mount( this.el, this.topBlock, this.noAudioWarning, true )

			this.sourceVolumeMonitor.update( { isAnimated: true } )
		}
	}

	public update( { volume, hasSource, recordingState }:  UIRecordingStateUpdateData ): this
	{
		if ( volume !== undefined ) this.sourceVolumeMonitor.update( { value: volume } )

		if ( hasSource !== undefined && hasSource !== this.hasSource ) this.toggleSourceAvailable()

		if ( recordingState !== undefined && recordingState !== this.currentRecordingState )
		{
			this.currentRecordingState = recordingState

			this.recordingToggle.update( [ this.recordingStates.indexOf( recordingState ) ] )
		}

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiRecordingState: {
				'& > *:first-child': {
					marginBottom: `0.5rem`,
				},
				'& button': {
					marginTop: `0.5rem`,
					display: `block`
				}
			},
			uiRecordingStateMonitor: {
				height: `0.8rem`,
				marginTop: `0.5rem`,
				width: `10rem`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}