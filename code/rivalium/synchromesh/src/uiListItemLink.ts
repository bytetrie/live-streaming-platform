import type { Styles } from "jss"
import { el, mount } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UILink } from "./uiLink"
import { UIText } from "./uiText"

enum CssClass
{
	uiListItemLink = `uiListItemLink`,
	uiListItemLinkSubtext = `uiListItemLinkSubtext`,
	uiListItemLinkTop = `uiListItemLinkTop`
}

export interface UIListItemLinkUpdateData
{
	linkText: string
	linkHREF: string
	subtext: string
	gotoItem?: ( linkHREF: string ) => void
}

export class UIListItemLink implements UI.Styled<CssClass>
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private link?: UILink

	private subtext?: UIText

	private helper?: UIMetaHelper

	constructor()
	{
		this.id = `UIListItemLink`

		this.el = el( `li` )

		this.styles = this.styles.bind( this )
	}

	public update( 
		{ linkHREF, linkText, subtext, gotoItem }: UIListItemLinkUpdateData, 
		_: number, 
		__: UIListItemLinkUpdateData[], 
		{ helper }: {helper: UIMetaHelper} ): this
	{
		let setCss = false

		if ( !this.helper ) 
		{
			this.helper = helper

			setCss = true
		}

		if( !this.link )
		{
			this.link = new UILink(
				this.helper,
				linkHREF,
				linkText,
				gotoItem ? { onLinkClick: gotoItem } : undefined )

			mount( this.el, this.link )
		}

		if ( !this.subtext )
		{
			this.subtext = new UIText( this.helper, subtext )
			
			mount( this.el, this.subtext )
		}

		this.link.update( { url: linkHREF } )

		this.link.update( { text: linkText } )

		this.subtext.update( subtext ) 

		if ( setCss ) 
		{
			this.helper.getCSSClasses( this )

			this.helper.setCss( this.el, this, CssClass.uiListItemLink )

			this.helper.setCss( this.link.el, this, CssClass.uiListItemLinkTop )

			this.helper.setCss( this.subtext.el, this, CssClass.uiListItemLinkSubtext )
		}

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiListItemLink: {
				listStyle: `none`,
				display: `block`
			},
			uiListItemLinkSubtext: {
				width: `100%`,
				whiteSpace: `nowrap`,
				textOverflow: `ellipsis`,
				display: `block`,
				overflow: `hidden`,
				fontSize: `0.85em`,
				paddingTop: `0.15rem`
			},
			uiListItemLinkTop: {
				whiteSpace: `nowrap`,
				overflow: `hidden`,
				textOverflow: `ellipsis`,
				fontWeight: `600`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}	