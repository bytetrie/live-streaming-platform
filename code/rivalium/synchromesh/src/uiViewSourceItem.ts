import type { Styles } from "jss"
import { el, mount, RedomComponent } from "redom"
import { AnimatedRectangleType, UIAnimatedRectangle } from "./uiAnimatedRectangle"
import { UIListItemLink, UIListItemLinkUpdateData } from "./uiListItemLink"
import { UITextEditable } from "./uiTextEditable"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UIList } from "./uiList"
import { UISwitchGroup } from "./uiSwitchGroup"
import { UIText } from "./uiText"
import { UIViewBase, UIViewBaseUpdateData } from "./uiViewBase"
import { BubbleCaret, UIHelpBubble } from "./uiHelpBubble"

enum CssClass
{
	uiViewSourceItem = `uiViewSourceItem`,
	uiViewSourceItemLabel = `uiViewSourceItemLabel`,
	uiViewSourceItemMonitor = `uiViewSourceItemMonitor`,
	uiViewSourceItemListTitle = `uiViewSourceItemListTitle`,
	uiViewSourceItemList = `uiViewSourceItemList`
}

enum MonitorState
{
	notMonitoring = `Not monitoring`,
	monitoring = `Monitoring`
}

export interface UIViewSourceItemHandler
{
	/**
	 * Handle update of channel label
	 */
	onSourceItemLabelChanged: ( label: string ) => void
	/**
	 * Handle change of monitoring state
	 */
	onMonitoringSourceItemStateChanged: ( state: MonitorState ) => void
	/**
	 * Go to the source list
	 */
	gotoSourceList: ( linkHREF: string ) => void
}

export interface UIViewSourceItemUpdateData extends UIViewBaseUpdateData
{
	volume?: number
	label?: string
	monitorState?: MonitorState
}

export interface UISourceConnectionListItem
{
	link: URL
	date: Date
	label: string
}

enum Bubble
{
	monitor,
	label
}

/*
* 	- volume level (monitor/stop monitor)
* 	- label
* 	- Input device info
* 	- Change input device
* 	- Deactivate input device
* 	- Connected streams
* - (monitor button sends selected source to context destination output channel 0)
*/

export class UIViewSourceItem implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: UIViewBase

	public classes?: Record<CssClass, string>

	private currentMonitorState: MonitorState

	private monitorStates: MonitorState[]

	private monitorToggle: UISwitchGroup

	// private volumeMeter: UIAnimatedRectangle

	private label: UITextEditable

	// private list: UIList<UIListItemLinkUpdateData>

	private bubbles: UIHelpBubble[]

	constructor(
		private helper: UIMetaHelper,
		private handler: UIViewSourceItemHandler,
		menuURL: string,
		label: string,
		connections: UISourceConnectionListItem[] = [] )
	{
		this.id = `UIViewSourceItem`

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.bubbles = this.buildBubbles()

		this.currentMonitorState = MonitorState.notMonitoring

		this.monitorStates = Object.values( MonitorState )

		this.monitorToggle = new UISwitchGroup(
			this.helper,
			this.monitorStates,
			{
				onClick: index => this.handler.onMonitoringSourceItemStateChanged( this.monitorStates[ index ] )
			},
			[ 0 ],
			false
		)

		// this.volumeMeter = new UIAnimatedRectangle( this.helper, AnimatedRectangleType.gradient, 0, true )

		this.label = new UITextEditable( this.helper, label, { onTextChanged: this.handler.onSourceItemLabelChanged } )

		// const listTitle = new UIText( this.helper, `Connected recordings` )

		// this.list = new UIList( this.helper, UIListItemLink )

		this.el = new UIViewBase(
			this.helper,
			`Return to source list`,
			menuURL,
			{ gotoMenuURL: this.handler.gotoSourceList } )

		const base = el( `div`, [
			this.monitorToggle,
			this.bubbles[ Bubble.monitor ],
			this.bubbles[ Bubble.label ],
			// this.volumeMeter,
			this.label,
			// listTitle,
			// this.list
		] )

		this.el.update( { content: [ base ], bubbles: this.bubbles } )

		this.helper.setCss( this.el.el, this, CssClass.uiViewSourceItem )

		this.helper.setCss( this.label.el, this, CssClass.uiViewSourceItemLabel )

		// this.helper.setCss( this.volumeMeter.el, this, CssClass.uiViewSourceItemMonitor )

		// this.helper.setCss( listTitle.el, this, CssClass.uiViewSourceItemListTitle )

		// this.helper.setCss( this.list.el, this, CssClass.uiViewSourceItemList )

		// const ordering = Object.values( connections )
		// 	.sort( ( a, b ) => a.label.localeCompare( b.label ) )
		// 	.map( item => item.link.toString() )

		// for ( const connection of connections )
		// {
		// 	this.add( connection )
		// }

		// this.list.update( { ordering } )
	}

	private buildBubbles()
	{
		return [
			// monitor
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Control monitoring state for the input source to hear audio as it will be recorded.` ),
					el( `br` ),
					new UIText( this.helper, `Monitoring is only available through the first output device channel.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `This toggle state indicates input source is being monitored:` ),
					new UISwitchGroup(
						this.helper,
						Object.values( MonitorState ),
						{ onClick: () => void {} },
						[ 1 ],
						false
					) ] ),

			// label
			new UIHelpBubble(
				this.helper,
				[
					new UIText( this.helper, `You can change the name of the source by clicking on this text.` ),
					el( `br` ),
					new UIText( this.helper, `This name is only used on this device.` )
				],
				BubbleCaret.downLeft ),
		]
	}

	/*
	private add( { label, link, date }: UISourceConnectionListItem )
	{
		const id = link.toString()

		this.list.update( { 
			item: { 
				id, 
				data:
				{
					linkHREF: id,
					linkText: date.toLocaleString(),
					subtext: label,
				} 
			} } )
	}
	*/

	// TODO: add remove connections
	public update( { label, monitorState, ...base }: UIViewSourceItemUpdateData ): this
	{
		// if ( volume !== undefined ) this.volumeMeter.update( { value: volume } )

		if ( label !== undefined ) this.label.update( label )

		if ( monitorState !== undefined && monitorState !== this.currentMonitorState )
		{
			this.currentMonitorState = monitorState

			this.monitorToggle.update( [ this.monitorStates.indexOf( monitorState ) ] )
		}

		this.el.update( base )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewSourceItem: {
				'& > div:last-child > button': {
					display: `block`,
					marginTop: `1rem`
				}
			},
			uiViewSourceItemLabel: {
				maxWidth: `50ch`,
				marginTop: `1rem`
			},
			uiViewSourceItemMonitor: {
				gridArea: `monitor`,
				height: `0.8rem`,
				maxWidth: `10rem`,
				marginTop: `1rem`
			},
			uiViewSourceItemListTitle: {
				display: `block`
			},
			uiViewSourceItemList: {
				marginTop: `1rem`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}