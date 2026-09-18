import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UITextInput } from "./uiTextInput"

enum CssClass
{
	uiTextCopy = `uiTextCopy`,
	uiTextCopyInput = `uiTextCopyInput`,
	uiTextCopyButton = `uiTextCopyButton`
}

export class UITextCopy implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private input: UITextInput

	private button: HTMLButtonElement

	constructor( private helper: UIMetaHelper, private text: string )
	{
		this.id = `UITextCopy`

		this.selectText = this.selectText.bind( this )

		this.copyText = this.copyText.bind( this )

		this.setCopyText = this.setCopyText.bind( this )

		this.basicCopy = this.basicCopy.bind( this )

		this.input = this.createInput()

		this.button = this.createButton()

		this.el = el( `div`, [ this.input, this.button ] )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiTextCopy )

		this.helper.setCss( this.input.el, this, CssClass.uiTextCopyInput )

		this.helper.setCss( this.button, this, CssClass.uiTextCopyButton )
	}

	private setCopyText( copied: boolean )
	{
		this.button.textContent = copied ? `Copied` : `Copy` 
	}

	private basicCopy()
	{
		this.selectText()

		document.execCommand( `copy` )

		this.setCopyText( true )

		setTimeout( this.setCopyText, 3000 )
	}

	private copyText()
	{
		if ( navigator.clipboard )
			navigator.clipboard.writeText( this.text )
				.then( () =>
				{
					this.setCopyText( true )

					setTimeout( this.setCopyText, 3000 )
				} )
				.catch( this.basicCopy )
		else
			this.basicCopy()
	}

	private selectText()
	{
		this.input.el.focus()
		
		this.input.el.setSelectionRange( 0, this.input.el.value.length )
	}

	private createInput()
	{
		const input = new UITextInput( this.helper, this.text )

		input.el.addEventListener( `focus`, this.selectText )

		return input
	}

	private createButton()
	{
		const button = el( `button`, `Copy` )

		button.addEventListener( `click`, event => 
		{
			event.preventDefault()

			this.copyText()
		} )

		return button
	}

	public update( text: string ): this
	{
		this.input.update( { value: text } )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiTextCopy: {
				display: `grid`,
				gridTemplateColumns: `1fr max-content`
			},
			uiTextCopyInput: {
				borderTopRightRadius: `0`,
				borderBottomRightRadius: `0`,
			},
			uiTextCopyButton: {
				height: `100%`,
				background: data => data.copyTextButtonBG,
				border: `1px solid`,
				borderColor: data => data.copyTextButtonBorder,
				borderLeft: `none`,
				boxShadow: data => `${data.copyTextButtonHover} 0px -2px 0px inset`,
				cursor: `pointer`,
				padding: `0.2rem 0.7rem`,
				fontSize: `0.8rem`,
				transition: `background-color 200ms ease-out`,
				borderTopRightRadius: `0.2rem`,
				borderBottomRightRadius: `0.2rem`,
				fontWeight: `600`,
				whiteSpace: `pre`,
				'&:focus': {
					outline: `none`,
				},
				'&:hover': {
					background: data => data.copyTextButtonHover
				},
				'&:active': {
					background: data => data.copyTextButtonActive
				}
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			copyTextButtonBG: `#fafafa`,
			copyTextButtonBorder: `#bbb`,
			copyTextButtonHover: `rgba(0, 0, 0, 0.1)`,
			copyTextButtonActive: `rgba(0, 0, 0, 0.2)`
		}
	}
}