import type { Styles } from "jss"
import { el, mount, RedomComponent } from "redom"
import { AnimatedRectangleType, UIAnimatedRectangle } from "./uiAnimatedRectangle"
import { UIButton } from "./uiButton"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UIList } from "./uiList"
import { UIListItemSourceMonitor, UIListItemSourceMonitorData } from "./uiListItemSourceMonitor"
import { UIText } from "./uiText"
import { UIViewBase, UIViewBaseUpdateData } from "./uiViewBase"
import { UILabel, UILabelColor } from "./uiLabel"
import { UIHelpBubble } from "./uiHelpBubble"
import { UILink } from "./uiLink"

enum CssClass
{
	uiViewSourceList = `uiViewSourceList`,
	uiViewSourceListActions = `uiViewSourceListActions`,
	uiViewSourceListEmpty = `uiViewSourceListEmpty`,
	uiViewSourceListList = `uiViewSourceListList`,

}

export interface UIViewSourceListHandler
{
	/**
	 * Activate the audio input device for the whole app
	 */
	requestActivateInputDevice: () => void
	/**
	 * Deactivate the audio input device for the whole app
	 */
	requestDeactivateInputDevice: () => void
	/**
	 * User requests change the current recording selected input source to the provided link
	 */
	requestChangeSelectedAudioInputSourceForRecording: ( link: URL ) => void
	/**
	 * Go to the current recording item
	 */
	gotoRecordingItem: ( linkHREF: string ) => void
	/**
	 * View the input channel associated with the link href
	 */
	gotoSourceItem: ( linkHREF: string ) => void

	// onCreateCombinedSourceClick: () => void
	// onSourceFromWebsiteClick: () => void
}

export interface AudioSourceItem
{
	link: URL
	label: string
}

interface AudioSourceItemInternal extends AudioSourceItem
{
	selector: UIButton
	selectedUI: UILabel
	volume: number
	monitor: UIAnimatedRectangle
}

export interface UIViewSourceListUpdateData extends UIViewBaseUpdateData
{
	item?: AudioSourceItem
	updateLabel?: {link: URL, label: string}
	updateVolume?: {link: URL, volume: number}
	audioDeviceActive?: boolean
	selected?: URL | string
	clearList?: boolean
}

enum Bubble
{
	activeBtn,
	sourceList
}

/**
 * <Audio input device channel # name>
 * <volume level>
 * 
 * <name of combined source>
 * <volume level>
 * 
 * <name/url of website source>
 * <volume level>
 *
 */

export class UIViewSourceList implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: UIViewBase

	public classes?: Record<CssClass, string>

	private base: HTMLElement

	private activateInput: UIButton

	private deactivateInput: UIButton

	// private combine: UIButton

	// private external: UIButton

	private actionButtons: HTMLElement

	private emptyList: UIText

	private listIsEmpty: boolean

	private list: UIList<UIListItemSourceMonitorData>

	private items: Record<string, AudioSourceItemInternal>

	private selectName: string

	private ordering: string[]

	private currentSelected: string

	private bubbles: UIHelpBubble[]

	constructor(
		private helper: UIMetaHelper,
		private handler: UIViewSourceListHandler,
		menuURL: string )
	{
		this.id = `UIViewSourceList`

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.selectName = `Set as source`

		this.bubbles = this.buildBubbles()

		this.activateInput = new UIButton( this.helper, `Activate input device`, { onClick: this.handler.requestActivateInputDevice } )

		this.deactivateInput = new UIButton( this.helper, `Deactivate input device`, { onClick: this.handler.requestDeactivateInputDevice } )

		// this.combine = new UIButton( this.helper, `Create combined source`, { onClick: this.handler.onCreateCombinedSourceClick } )

		// this.external = new UIButton( this.helper, `Source from a website`, { onClick: this.handler.onSourceFromWebsiteClick } )

		this.emptyList = new UIText( this.helper, `You have no audio sources.` )

		this.listIsEmpty = true

		this.currentSelected = ``
		
		this.list = new UIList( this.helper, UIListItemSourceMonitor )

		this.actionButtons = el( `div`, [
			this.activateInput, 
			this.bubbles[ Bubble.activeBtn ]
			/* this.combine, this.external */ 
		] )

		this.base = el( `div`, [ 
			this.actionButtons,
			this.emptyList,
			this.bubbles[ Bubble.sourceList ]
		] )

		this.el = new UIViewBase(
			this.helper, 
			`Return to recording`,
			menuURL,
			{ gotoMenuURL: this.handler.gotoRecordingItem } )

		this.el.update( { content: [ this.base ], bubbles: this.bubbles } )

		this.items = {}

		this.ordering = []

		this.helper.setCss( this.el.el, this, CssClass.uiViewSourceList )

		this.helper.setCss( this.actionButtons, this, CssClass.uiViewSourceListActions )

		this.helper.setCss( this.list.el, this, CssClass.uiViewSourceListList )

		this.helper.setCss( this.emptyList.el, this, CssClass.uiViewSourceListEmpty )
	}

	private buildBubbles()
	{
		return [
			// activeBtn
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Enable and disable access to your audio input device.` ),
					el( `br` ),
					new UIText( this.helper, `Access to the audio device is required to allow recording.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `You may need to select the audio device and click "Allow" when prompted.` ) ] ),

			// sourceList
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `This list displays the audio input sources available on this device.` ),
					el( `br` ),
					new UIText( this.helper, `Each source represents an individual "channel" from the active audio input device.` ),
					el( `br` ),
					new UIText( this.helper, `On the left is the source link and name, e.g.: ` ),
					new UILink( this.helper, `#`, `Source channel 1`, { onLinkClick: () => void {} } ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `On the right is the setting state:` ),
					el( `br` ),
					new UIButton( this.helper, this.selectName, { onClick: () => void {} } ),
					new UIText( this.helper, ` clicking this button will set the source for the current stream.` ),
					el( `br` ),
					el( `br` ),
					new UILabel( this.helper, UILabelColor.blue, `Current source` ),
					new UIText( this.helper, ` indicates if a source is selected for the current stream.` )
				] )
		]
	}

	private sortLabel()
	{
		this.ordering = Object.values( this.items )
			.sort( ( a, b ) => a.label.localeCompare( b.label ) )
			.map( item => item.link.toString() )

		return this
	}

	private add( item: AudioSourceItem )
	{
		const id = item.link.toString()

		if ( this.items[ id ] ) return

		const selector = new UIButton(
			this.helper,
			this.selectName,
			{ onClick: () => this.handler.requestChangeSelectedAudioInputSourceForRecording( item.link ) } )

		const selectedUI = new UILabel( this.helper, UILabelColor.blue, `Current source` )

		const monitor = new UIAnimatedRectangle( this.helper, AnimatedRectangleType.gradient, 0, true )

		this.items[ id ] = { ...item, selector, selectedUI, volume: 0, monitor }

		this.sortLabel()

		this.list.update( { 
			item: { 
				id, 
				data:
				{
					linkHREF: item.link.toString(),
					linkText: item.label,
					monitor,
					annotation: this.currentSelected === id ? selectedUI : selector,
					gotoItem: this.handler.gotoSourceItem
				} 
			},
			ordering: this.ordering } )

		if ( this.listIsEmpty )
		{
			this.listIsEmpty = false

			mount( this.base, this.list, this.emptyList, true )
		}
	}

	private updateItem( link: URL, label?: string, volume?: number )
	{
		const id = link.toString()
		
		if ( !this.items[ id ] ) return

		if ( label !== undefined )
		{
			this.items[ id ].label = label

			this.sortLabel()

			this.list
				.update( {
					update: {
						id,
						data:
						{
							linkHREF: this.items[ id ].link.toString(),
							linkText: this.items[ id ].label,
							annotation: this.currentSelected === id
								? this.items[ id ].selectedUI
								: this.items[ id ].selector,
							monitor: this.items[ id ].monitor
						}
					} } )
				.update( { ordering: this.ordering } )
		}

		if ( volume !== undefined )
		{
			this.items[ id ].volume = volume

			this.items[ id ].monitor.update( { value: volume } )
		}
	}

	private setSelected( id: string )
	{
		// set the new item
		if ( id )
		{
			this.list.update( { update: { id, data: { annotation: this.items[ id ].selectedUI } } } )
		}

		// unset the previously selected item
		if ( this.currentSelected && this.currentSelected !== id )
		{
			this.list.update( { update: { id: this.currentSelected, data: {
				annotation: this.items[ this.currentSelected ].selector
			} } } )
		}	

		this.currentSelected = id
	}

	public update( { 
		item, 
		updateLabel, 
		updateVolume, 
		audioDeviceActive, 
		selected,
		clearList,
		...base
	}: UIViewSourceListUpdateData ): this
	{
		if ( clearList )
		{
			this.setSelected( `` )

			this.list.update( { clear: true } )

			this.items = {}

			this.ordering = []
			
			this.listIsEmpty = true

			mount( this.base, this.emptyList, this.list, true )
		}

		if ( item ) this.add( item )

		if ( updateLabel ) this.updateItem( updateLabel.link, updateLabel.label )

		if ( updateVolume ) this.updateItem( updateVolume.link, undefined, updateVolume.volume )

		if ( selected !== undefined ) this.setSelected( selected.toString() )

		if ( audioDeviceActive !== undefined )
		{
			if ( audioDeviceActive ) mount( this.actionButtons, this.deactivateInput, this.activateInput, true ) 
			else mount( this.actionButtons, this.activateInput, this.deactivateInput, true ) 
		}

		this.el.update( base )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewSourceList: {},
			uiViewSourceListActions: {
				'& button': {
					display: `block`
				}
			},
			uiViewSourceListEmpty: {
				marginTop: `1.5rem`,
				display: `block`
			},
			uiViewSourceListList: {
				marginTop: `1.5rem !important`,
				'& > li > div:first-child': {
					height: `25px`
				}
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}