import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import { AnimatedRectangleType, UIAnimatedRectangle } from "./uiAnimatedRectangle"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UIText } from "./uiText"

enum CssClass
{
	uiAudioPlayer = `uiAudioPlayer`,
	uiAudioPlayerProgress = `uiAudioPlayerProgress`,
}

export interface UIAudioPlayerHandler
{
	onTogglePlaying: () => void
}

export enum UIAudioPlayerState
{
	empty,
	buffering,
	live,
	progress,
	random
}

export interface UIAudioPlayerUpdateProgress
{
	state?: UIAudioPlayerState.progress
	totalSeconds: number
	currentSeconds: number
}

export interface UIAudioPlayerUpdateState
{
	state: 
		| UIAudioPlayerState.live
		| UIAudioPlayerState.empty
		| UIAudioPlayerState.random
		| UIAudioPlayerState.buffering
}

export interface UIAudioPlayerUpdatePlaying
{
	playing: boolean
}

export type UIAudioPlayerUpdateData = 
	| UIAudioPlayerUpdateProgress
	| UIAudioPlayerUpdateState
	| UIAudioPlayerUpdatePlaying


export class UIAudioPlayer implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private toggle: HTMLElement

	private input: HTMLInputElement

	private progressBar: UIAnimatedRectangle

	private playback: HTMLDivElement

	private state: UIAudioPlayerState

	private stateTextEl: UIText

	constructor(
		private helper: UIMetaHelper,
		private handler: UIAudioPlayerHandler,
		private stateText: Record<UIAudioPlayerState, string> = {
			[ UIAudioPlayerState.buffering ]: `Bufferring`,
			[ UIAudioPlayerState.live ]: `Live`,
			[ UIAudioPlayerState.empty ]: `No data available`,
			[ UIAudioPlayerState.progress ]: `Playing`,
			[ UIAudioPlayerState.random ]: `Randomised playback mode`,
		} )
	{
		this.id = `UIAudioPlayer`

		this.state = UIAudioPlayerState.empty

		const [ input, toggle ] = this.createToggle()

		this.input = input

		this.toggle = toggle

		const [ progress, playback, stateTextEl ] = this.createPlayback()

		this.progressBar = progress

		this.playback = playback

		this.stateTextEl = stateTextEl

		this.el = el( `div`, [ this.toggle, this.playback ] )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiAudioPlayer )
		
		this.helper.setCss( this.progressBar.el, this, CssClass.uiAudioPlayerProgress )
	}

	private pad( n: number ): string
	{
		return n.toString().padStart( 2, `0` )
	}

	private getTimestamp( time: number )
	{
		const hours = Math.floor( time / 3600 )

		const minutes = Math.floor( ( time - ( hours * 3600 ) ) / 60 )

		const seconds = time - ( hours * 3600 ) - ( minutes * 60 )

		return `${this.pad( hours )}:${this.pad( minutes )}:${this.pad( seconds )}`
	}

	private createPlayback(): [UIAnimatedRectangle, HTMLDivElement, UIText]
	{
		const progress = new UIAnimatedRectangle( this.helper, )

		const state = new UIText( this.helper, this.stateText[ this.state ] )
		
		const playback = el( `div`, [ el( `div`, state ), progress ] )

		return [ progress, playback, state ]
	}

	private createToggle(): [HTMLInputElement, HTMLDivElement]
	{
		const id = `id_${Math.random()}`

		const input = el( 
			`input`, 
			{ id, type: `checkbox`, checked: false },
			input => input.addEventListener( `click`, event =>
			{
				event.preventDefault()
			} ) )

		return [
			input,
			el(
				`div`,
				[
					input,
					el( 
						`label`, 
						[ 
							new UIText( this.helper, `Play` ), 
							new UIText( this.helper, `Pause` ) 
						], 
						{ for: id }, 
						label => label.addEventListener( `click`, ( event ) => 
						{
							event.preventDefault()
							
							event.stopPropagation()

							this.handler.onTogglePlaying()
						} ) )
				] )
		]
	}

	private progressAmount( max: number, value: number )
	{
		this.progressBar.update( { value: value/max } )
	}

	private setState( state: UIAudioPlayerState.progress, totalSeconds: number, currentSeconds: number ): void

	private setState( state: UIAudioPlayerState.live | UIAudioPlayerState.empty | UIAudioPlayerState.random | UIAudioPlayerState.buffering ): void

	private setState( state: UIAudioPlayerState, totalSeconds?: number, currentSeconds?: number ): void
	{
		this.state = state

		this.playback.className = ``

		this.stateTextEl.el.textContent = this.stateText[ this.state ]

		switch( this.state )
		{
			case UIAudioPlayerState.buffering:

				this.progressBar.update( { type: AnimatedRectangleType.striped, isAnimated: true } )

				this.progressAmount( 1, 1 )

				break

			case UIAudioPlayerState.live:

				this.progressBar.update( { type: AnimatedRectangleType.red, isAnimated: false } )

				this.progressAmount( 1, 1 )

				break

			case UIAudioPlayerState.empty:

				this.progressBar.update( { type: AnimatedRectangleType.grey, isAnimated: false } )

				this.progressAmount( 1, 1 )

				break

			case UIAudioPlayerState.random:

				this.progressBar.update( { type: AnimatedRectangleType.noise, isAnimated: false } )

				this.progressAmount( 1, 1 )
	
				break

			case UIAudioPlayerState.progress:

				this.progressBar.update( { type: AnimatedRectangleType.blue, isAnimated: true } )

				this.progressAmount( totalSeconds ?? 1, currentSeconds ?? 0 )

				this.stateTextEl.el.textContent = 
					`${this.getTimestamp( Math.floor( currentSeconds ?? 0 ) )} / ${this.getTimestamp( Math.floor( totalSeconds ?? 1 ) )}`

				break
		}
	}

	private setPlaying( playing: boolean ): void
	{
		this.input.checked = playing
	}

	private dataIsPlaying( data: UIAudioPlayerUpdateData ): data is UIAudioPlayerUpdatePlaying
	{
		return `playing` in data
	}

	private dataIsState( data: UIAudioPlayerUpdateData ): data is UIAudioPlayerUpdateState
	{
		return `state` in data
	}

	private dataIsProgress( data: UIAudioPlayerUpdateData ): data is UIAudioPlayerUpdateProgress
	{
		return `totalSeconds` in data
	}

	public update( data: UIAudioPlayerUpdateData ): this
	{
		if ( this.dataIsPlaying( data ) ) this.setPlaying( data.playing )

		if ( this.dataIsState( data ) ) this.setState( data.state )

		if ( this.dataIsProgress( data ) )
			this.setState( UIAudioPlayerState.progress, data.totalSeconds, data.currentSeconds )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiAudioPlayer: {
				height: `2.8rem`,
				border: `1px solid`,
				background: data => data.audioPlayerBG,
				borderColor: data => data.audioPlayerBorder,
				display: `grid`,
				gridTemplateColumns: `max-content 1fr`,
				'& > div:first-child': {
					height: `100%`,
					boxSizing: `border-box`,
					width: `max-content`,
					minWidth: `5rem`,
					'& > label': {
						padding: `0.6rem`,
						display: `block`,
						textAlign: `center`,
						height: `100%`,
						transition: `background-color 200ms ease-out`,
						cursor: `pointer`,
						borderRight: `1px solid`,
						borderRightColor: data => data.audioPlayerBorder,
						borderBottom: `2px solid`,
						borderBottomColor: data => data.audioPlayerHoverBG,
						'&:hover': {
							background: data => data.audioPlayerHoverBG
						},
						'&:active': {
							background: data => data.audioPlayerActiveBG
						},
						'& > span': {
							fontWeight: `600`,
							'&:last-child': {
								display: `none`
							}
						}
					},
					'& > input': {
						visibility: `hidden`,
						position: `absolute`,
						left: `-9999px`,
						'&:checked + label': {
							'& > span': {
								'&:first-child': {
									display: `none`
								},
								'&:last-child': {
									display: `block`
								}
							}
						}
					}
				},
				'& > div:nth-child(2)': {
					display: `grid`,
					gridTemplateRows: `1fr max-content`,
					'& > div:first-child': {
						padding: `0.6rem 0.5rem`,
						'& > span': {
							fontSize: `0.8rem`
						}
					},
					'& progress': {
						height: `0.3rem`,
						width: `100%`
					}
				}
			},
			uiAudioPlayerProgress: {
				height: `0.25rem`,
				position: `relative`,
				overflow: `hidden`,
				background: data => data.audioPlayerPlaybackBG,
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			audioPlayerBG: `#fafafa`,
			audioPlayerIcon: `#777`,
			audioPlayerBorder: `#bbb`,
			audioPlayerHoverBG: `rgba(0, 0, 0, 0.1)`,
			audioPlayerActiveBG: `rgba(0, 0, 0, 0.2)`,
			audioPlayerPlaybackBG: `#dadada`
		}
	}
}