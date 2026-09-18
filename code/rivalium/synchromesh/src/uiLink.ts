import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiLinkBase = `uiLinkBase`,
	uiLink = `uiLink`,
	uiLinkInverted = `uiLinkInverted`
}

export interface UILinkUpdateData
{
	url?: string
	text?: string
}

export interface UILinkHandler
{
	onLinkClick: ( url: string ) => void
}

export class UILink implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLAnchorElement

	public classes?: Record<CssClass, string>

	constructor(
		private helper: UIMetaHelper,
		url: string,
		text: string,
		private handler?: UILinkHandler,
		invert?: boolean,
		newWindow?: boolean )
	{
		this.id = `UILink`

		this.el = el( `a`, text, { href: url, target: newWindow ? `_blank` : ``, rel: newWindow ? `noopener` : `` } )

		if ( handler )
			this.el.addEventListener( `click`, event =>
			{
				event.preventDefault()
				
				this.handler?.onLinkClick( this.el.href )
			} )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, invert ? CssClass.uiLinkInverted : CssClass.uiLink )
	}

	public update( { text, url }: UILinkUpdateData ): this
	{
		if ( text !== undefined ) this.el.textContent = text

		if ( url !== undefined ) this.el.href = url

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiLinkBase: {
				textDecorationStyle: `dotted`,
				textDecorationThickness: `1px`,
				fontSize: `0.9rem`
			},
			uiLink: {
				extend: `uiLinkBase`,
				color: data => data.link,
				'&:visited': {
					color: data => data.linkVisited
				}
			},
			uiLinkInverted: {
				extend: `uiLinkBase`,
				color: data => data.linkInverted,
				'&:visited': {
					color: data => data.linkInvertedVisited
				}
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			link: `#316aac`,
			linkVisited: `#227747`,
			linkInverted: `#90feff`,
			linkInvertedVisited: `#acff34`
		}
	}
}	