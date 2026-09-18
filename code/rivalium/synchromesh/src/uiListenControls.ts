import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import { UIAudioPlayer, UIAudioPlayerState } from "./uiAudioPlayer"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UISwitchGroup } from "./uiSwitchGroup"

enum CssClass
{
	uiListenControls = `uiListenControls`,
	uiListenControlsPlayer = `uiListenControlsPlayer`
}

export enum ListenState
{
	normal = `Normal`,
	random = `Random`,
	live = `Live`
}

export interface UIListenControlsHandler
{
	/**
	 * Request listen state change for current listening context
	 */
	requestListenStateChange: ( state: ListenState ) => void
	/**
	 * Request playing state toggle for current listening context
	 */
	requestPlayingStateToggle: () => void
}

export interface UIListenControlsUpdateData
{
	listenState?: ListenState
	currentSeconds?: number
	totalSeconds?: number
	buffering?: boolean
	noData?: boolean
	playing?: boolean
}

/**
 * Updates:
 * - when switch to live and has data, update with live state
 * - when switch to live/progress and is downloading data, update to buffering
 * - when switch to random and got data, update to random
 * - when live/buffering/progress/random and no data for x seconds
 * 
 * currentTime -> number for normal mode
 * totalTime -> ``
 * buffering -> t/f
 * noData -> t/f
 * state -> live/normal/random
 * playing -> t/f
 * 
 */

export class UIListenControls implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private currentListenState: ListenState

	private listenStates: ListenState[]

	private listenToggle: UISwitchGroup

	private player: UIAudioPlayer

	private currentTime: number

	private totalTime: number

	constructor( private helper: UIMetaHelper, private handler: UIListenControlsHandler )
	{
		this.id = `UIListenControls`

		this.styles = this.styles.bind( this )

		this.onListenSwitchClick = this.onListenSwitchClick.bind( this )

		this.helper.getCSSClasses( this )

		this.currentTime = 0

		this.totalTime = 0

		this.currentListenState = ListenState.normal

		this.listenStates = Object.values( ListenState )

		this.listenToggle = new UISwitchGroup(
			this.helper,
			this.listenStates,
			{
				onClick: this.onListenSwitchClick
			},
			[ 0 ],
			false
		)

		this.player = new UIAudioPlayer( 
			this.helper, 
			{ onTogglePlaying: this.handler.requestPlayingStateToggle } )

		this.el = el( `div`, [
			// hidden until implemented
			// this.listenToggle,
			this.player
		] )

		this.helper.setCss( this.el, this, CssClass.uiListenControls )

		this.helper.setCss( this.player.el, this, CssClass.uiListenControlsPlayer )
	}
	
	private onListenSwitchClick( index: number )
	{
		if ( this.listenStates[ index ] === this.currentListenState ) return

		this.handler.requestListenStateChange( this.listenStates[ index ] )
	}

	private updateListenState( state: number | ListenState )
	{
		const index = typeof state === `number`
			? state
			: this.listenStates.findIndex( s => s === state )

		this.currentListenState = this.listenStates[ index ] 

		this.listenToggle.update( [ index ] )
	}

	public update( { buffering, noData, playing, currentSeconds, totalSeconds, listenState }: UIListenControlsUpdateData ): this
	{
		if ( currentSeconds !== undefined || totalSeconds !== undefined || noData === false || buffering === false )
		{
			this.currentTime = currentSeconds ?? this.currentTime

			this.totalTime = totalSeconds ?? this.totalTime

			if ( this.currentListenState === ListenState.normal )
				this.player.update( { currentSeconds: this.currentTime, totalSeconds: this.totalTime } )
			else
				this.player.update( {
					state: this.currentListenState === ListenState.live 
						? UIAudioPlayerState.live 
						: UIAudioPlayerState.random } )
		}

		if ( playing !== undefined ) this.player.update( { playing } )

		if ( buffering ) this.player.update( { state: UIAudioPlayerState.buffering } )

		if ( noData ) this.player.update( { state: UIAudioPlayerState.empty } )

		if ( listenState ) this.updateListenState( listenState )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiListenControls: {},
			uiListenControlsPlayer: {}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}