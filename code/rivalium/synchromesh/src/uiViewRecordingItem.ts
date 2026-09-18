import type { Styles } from "jss"
import { el, mount, RedomComponent } from "redom"
import { UIButton } from "./uiButton"
import { UITextEditable } from "./uiTextEditable"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UILink } from "./uiLink"
import { UILoadingMessage } from "./uiLoadingMessage"
import { RecordingState, UIRecordingState, UIRecordingStateHandler, UIRecordingStateUpdateData } from "./uiRecordingState"
import { UIStreamURLs } from "./uiStreamURLs"
import { UIText } from "./uiText"
import { UIViewBase, UIViewBaseUpdateData } from "./uiViewBase"
import { BubbleCaret, UIHelpBubble } from "./uiHelpBubble"
import { UISwitchGroup } from "./uiSwitchGroup"

enum CssClass
{
	uiViewRecordingItem = `uiViewRecordingItem`,
	uiViewRecordingItemDate = `uiViewRecordingItemDate`,
	uiViewRecordingItemLabel = `uiViewRecordingItemLabel`,
	uiViewRecordingItemListen = `uiViewRecordingItemListen`,
	uiViewRecordingItemCloud = `uiViewRecordingItemCloud`,
	uiViewRecordingItemCloudData = `uiViewRecordingItemCloudData`
}

export interface UIViewRecordingItemHandler extends UIRecordingStateHandler
{
	/**
	 * User requests to create an endpoint for the current recording item
	 */
	requestCreateRecordingEndpoint: () => void
	/**
	 * User set new value for the label for the current recording item
	 */
	onRecordingItemLabelChanged: ( label: string ) => void
	/**
	 * Go to the listen item associated with the current recording item
	 */
	gotoListenItem: ( linkHREF: string ) => void
	/**
	 * Go to the list of recording items
	 */
	gotoRecordingList: ( linkHREF: string ) => void
}

export interface UIViewRecordingItemUpdateData extends UIViewBaseUpdateData
{
	label?: string
	cloudData?: {publicURL: URL, publicShareURL: string, adminShareURL: string}
	updateRecordingState?: UIRecordingStateUpdateData
	listenLink?: URL
}

enum Bubble
{
	recordingBlock,
	date,
	label,
	listenLink,
	cloud
}

export class UIViewRecordingItem
implements 
	UI.Styled<CssClass>,
	RedomComponent
{
	public id: string

	public el: UIViewBase

	public classes?: Record<CssClass, string>

	private base: HTMLElement

	private label: UITextEditable

	private date: UIText

	private cloudStore: HTMLElement

	private createCloud: UIButton

	private cloudData: UIStreamURLs

	private recordingBlock: UIRecordingState

	private listenLink: UILink

	private bubbles: UIHelpBubble[]

	constructor(
		private helper: UIMetaHelper,
		private handler: UIViewRecordingItemHandler,
		menuURL: string,
		created: Date )
	{
		this.id = `UIViewRecordingItem`

		this.createCloudServer = this.createCloudServer.bind( this )

		this.setCloudData = this.setCloudData.bind( this )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.bubbles = this.buildBubbles()

		this.label = new UITextEditable( this.helper, `New Recording`, {
			onTextChanged: this.handler.onRecordingItemLabelChanged
		} )

		this.date = new UIText( this.helper, created.toLocaleString() )

		this.recordingBlock = new UIRecordingState( this.helper, this.handler )

		this.createCloud = new UIButton( this.helper, `Add live stream cloud server`, {
			onClick: this.createCloudServer
		} )

		this.cloudStore = el( `div`, [ 
			new UIText( this.helper, `This recording is only available on your device.` ), 
			this.createCloud ] )

		this.listenLink = new UILink(
			this.helper,
			`#`,
			`Listen to this stream`,
			{ onLinkClick: this.handler.gotoListenItem } )

		this.base = el( `div`, [
			this.recordingBlock,
			this.bubbles[ Bubble.recordingBlock ],
			this.date,
			this.bubbles[ Bubble.date ],
			this.bubbles[ Bubble.label ],
			this.label,
			this.bubbles[ Bubble.listenLink ],
			this.cloudStore,
			this.bubbles[ Bubble.cloud ]
		] )

		this.el = new UIViewBase(
			this.helper,
			`View recording list`,
			menuURL,
			{ gotoMenuURL: this.handler.gotoRecordingList } )

		this.el.update( { content: [ this.base ], bubbles: this.bubbles } )

		/**
		 * Cloud info is mounted after data is set,
		 * it then replaces the create cloud button
		 */

		this.cloudData = new UIStreamURLs( this.helper )

		this.helper.setCss( this.el.el, this, CssClass.uiViewRecordingItem )

		this.helper.setCss( this.date.el, this, CssClass.uiViewRecordingItemDate )

		this.helper.setCss( this.label.el, this, CssClass.uiViewRecordingItemLabel )

		this.helper.setCss( this.listenLink.el, this, CssClass.uiViewRecordingItemListen )

		this.helper.setCss( this.cloudStore, this, CssClass.uiViewRecordingItemCloud )

		this.helper.setCss( this.cloudData.el, this, CssClass.uiViewRecordingItemCloudData )
	}

	private buildBubbles()
	{
		return [
			// recordingBlock
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Control recording state and manage the input source for audio capture.` ),
					el( `br` ),
					new UIText( this.helper, `To enable recording, you need to select an input source.` ),
					el( `br` ),
					el( `br` ),
					new UIText( this.helper, `This toggle state indicates the audio capture is recording:` ),
					new UISwitchGroup(
						this.helper,
						Object.values( RecordingState ),
						{ onClick: () => void {} },
						[ 1 ],
						false
					) ] ),

			// date
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `The date when your recording was created.` ) ] ),

			// label
			new UIHelpBubble(
				this.helper,
				[
					new UIText( this.helper, `You can change the name of the recording by clicking on this text.` ),
					el( `br` ),
					new UIText( this.helper, `This name is only used on this device.` )
				],
				BubbleCaret.downLeft ),

			// listenLink
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `This link navigates to the recording's playback view.` )
				],
				BubbleCaret.downLeft ),

			// cloud
			new UIHelpBubble(
				this.helper, [
					new UIText( this.helper, `Public URL: used for sharing the stream with others. This URL can't be used for recording.` ),
					el( `br` ),
					new UIText( this.helper, `Admin URL: used for changing stream data, it is used for recording.` )
				] ),
		]
	}

	private createCloudServer()
	{
		mount( this.cloudStore, new UILoadingMessage( this.helper, `Creating stream` ), this.createCloud, true )

		this.handler.requestCreateRecordingEndpoint()
	}

	public setCloudData( publicURL: string, publicShareURL: string, adminShareURL: string ): void
	{
		// update cloud data block
		this.cloudData.update( { publicURL: publicShareURL, adminURL: adminShareURL } )
		
		// swap storage component data with cloud data
		mount( this.base, this.cloudData, this.cloudStore, true )

		mount( this.base, this.cloudData, this.bubbles[ Bubble.cloud ] )

		this.listenLink.update( { url: publicURL } )

		mount( this.base, this.listenLink, this.cloudData )
	}

	public update( { label, cloudData, updateRecordingState, listenLink, ...base }: UIViewRecordingItemUpdateData ): this
	{
		if ( label !== undefined ) this.label.update( label )

		if ( listenLink )
		{
			this.listenLink.update( { url: listenLink.toString() } )

			mount( this.base, this.listenLink, this.cloudStore )
		}

		if ( cloudData ) 
			this.setCloudData( cloudData.publicURL.toString(), cloudData.publicShareURL, cloudData.adminShareURL )

		if ( updateRecordingState ) this.recordingBlock.update( updateRecordingState )

		this.el.update( base )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewRecordingItem: {},
			uiViewRecordingItemDate: {
				marginTop: `2rem`,
				display: `block`
			},
			uiViewRecordingItemLabel: {
				maxWidth: `50ch`,
				marginTop: `0.5rem`
			},
			uiViewRecordingItemListen: {
				display: `block`,
				marginBottom: `0.5rem`,
			},
			uiViewRecordingItemCloud: {
				'& span:first-child': {
					display: `block`,
					marginBottom: `0.5rem`,
				}
			},
			uiViewRecordingItemCloudData: {
				marginTop: `0.5rem`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}