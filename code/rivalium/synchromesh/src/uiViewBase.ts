import type { Styles } from "jss"
import { el, RedomComponent, setChildren } from "redom"
import { UIHeader, UIHeaderHandler, UIHeaderUpdateData } from "./uiHeader"
import type { UIHelpBubble } from "./uiHelpBubble"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiViewBase = `uiViewBase`,
	uiViewBaseHeader = `uiViewBaseHeader`
}

export interface UIViewBaseUpdateData extends UIHeaderUpdateData
{
	content?: ( HTMLElement | RedomComponent )[]
	bubbles?: UIHelpBubble[]
}

export class UIViewBase implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private menu: UIHeader

	private contentWrap: HTMLElement

	private bubbles: UIHelpBubble[]

	constructor(
		private helper: UIMetaHelper,
		menuText: string,
		menuURL: string,
		handler?: Partial<UIHeaderHandler>
	)
	{
		this.id = `UIViewBase`

		this.styles = this.styles.bind( this )

		this.showHelp = this.showHelp.bind( this )

		this.hideHelp = this.hideHelp.bind( this )

		this.helper.getCSSClasses( this )

		this.menu = new UIHeader( 
			this.helper, 
			menuText,
			menuURL,
			{
				gotoMenuURL: link => handler?.gotoMenuURL?.( link ),
				hideHelp: () =>
				{
					this.hideHelp()

					if ( handler?.hideHelp ) handler.hideHelp()
				},
				showHelp: () =>
				{
					this.showHelp()

					if ( handler?.showHelp ) handler.showHelp()
				}
			} )

		this.contentWrap = el( `div` )

		this.bubbles = []

		this.el = el( `div`, [ this.menu, this.contentWrap ] )

		this.helper.setCss( this.el, this, CssClass.uiViewBase )

		this.helper.setCss( this.menu.el, this, CssClass.uiViewBaseHeader )
	}

	private showHelp()
	{
		for ( const bubble of this.bubbles )
		{
			bubble.update( { visible: true } )
		}
	}

	private hideHelp()
	{
		for ( const bubble of this.bubbles )
		{
			bubble.update( { visible: false } )
		}
	}

	public update( { menuBtnText, menuBtnURL, content, bubbles }: UIViewBaseUpdateData ): this
	{
		if ( menuBtnText !== undefined ) this.menu.update( { menuBtnText } )

		if ( menuBtnURL !== undefined ) this.menu.update( { menuBtnURL } )

		if ( content ) setChildren( this.contentWrap, content )

		if ( bubbles ) for ( const bubble of bubbles ) this.bubbles.push( bubble )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewBase: {
				position: `relative`,
				height: `100%`,
				transform: `translateZ(0)`,
				'& > div': {
					height: `100%`,
					overflow: `auto`,
					padding: `0.5rem`,
					'@media (min-width: 767px)': {
						paddingTop: `4rem`,
					},
					'@media (max-width: 766px)': {
						paddingTop: `0.5rem`,
						paddingBottom: `3rem`
					},
					'& > div': {
						maxWidth: `50rem`,
						margin: `0 auto`,
						paddingBottom: `3rem`,
					}
				}
			},
			uiViewBaseHeader: {
				left: `0.5rem`,
				right: `0.5rem`,
				zIndex: `9999`,
				position: `fixed`,
				width: `auto !important`,
				'@media (min-width: 767px)': {
					top: `0.5rem`,
				},
				'@media (max-width: 766px)': {
					bottom: `0.5rem`,
				}
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}