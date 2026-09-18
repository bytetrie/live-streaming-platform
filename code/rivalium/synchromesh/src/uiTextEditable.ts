import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import { UIButton, UIButtonHandler } from "./uiButton"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	UITextEditable = `UITextEditable`,
}

export interface UITextEditableHandler
{
	onTextChanged: ( text: string ) => void
}

export class UITextEditable implements UI.Styled<CssClass>, RedomComponent, UIButtonHandler
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	public onClick: ( event: MouseEvent ) => void

	private input: HTMLTextAreaElement

	private spacer: HTMLSpanElement

	private currentInput: string

	private saveButton: UIButton

	constructor( private helper: UIMetaHelper, private text: string, private handler: UITextEditableHandler )
	{
		this.id = `UITextEditable`

		this.currentInput = ``

		this.setText = this.setText.bind( this )

		this.resetText = this.resetText.bind( this )

		this.saveButtonClick = this.saveButtonClick.bind( this )

		this.update = this.update.bind( this )

		this.onClick = this.saveButtonClick

		this.handler.onTextChanged = this.handler.onTextChanged.bind( this )

		this.input = this.createInput()

		this.spacer = el( `span` )

		this.setText( this.text )

		this.saveButton = new UIButton( this.helper, `Save changes`, this )

		this.el = el( `div`, el( `div`, [ 
			this.spacer, 
			this.input, 
			this.saveButton ] ) )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.UITextEditable )
	}

	private saveButtonClick()
	{
		this.handler.onTextChanged( this.currentInput )
	}

	private createInput()
	{
		const input = el( `textarea` )

		input.addEventListener( `keydown`, ( event: KeyboardEvent ) => 
		{
			if ( event.key === `Enter` )
			{
				event.preventDefault()

				this.setText( this.currentInput, false, true )

				return
			}

			this.setText()
		} )

		input.addEventListener( `keyup`, () => this.setText( undefined, true ) )

		input.addEventListener( `blur`, ( event: Event ) =>
		{
			event.preventDefault()

			setTimeout( () =>
			{
				if ( document.activeElement === this.saveButton.el )
					this.saveButtonClick()
				else
					this.resetText()
			}, 1 )
		} )
		
		return input
	}

	private resetText()
	{
		this.setText( this.text )
	}

	private setText( text?: string, upEvent?: boolean, newLine?: boolean )
	{
		if ( upEvent && this.currentInput === this.input.value ) return

		const cursor = this.input.selectionStart

		const cursorEnd = this.input.selectionEnd

		const cursorDir = this.input.selectionDirection

		const value = text != undefined 
			? newLine
				? `${text.slice( 0, cursor )}\n${text.slice( cursor )}`
				: text
			: this.input.value

		this.input.value = this.currentInput

		this.spacer.textContent = value + `x`

		this.input.value = value

		this.currentInput = value
		
		this.input.setSelectionRange( newLine ? cursor + 1 : cursor, newLine ? cursorEnd + 1 : cursorEnd, cursorDir )
	}

	public update( text: string ): this
	{
		this.text = text

		this.setText( text )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			UITextEditable: {
				paddingBottom: `1.8rem`,
				'& > div': {
					position: `relative`,
					padding: `0.5rem`,
					border: `1px solid`,
					borderTopWidth: `2px`,
					borderColor: data => data.editableTextBorder,
					borderRadius: `0.2rem`,
					'& > span:first-child': {
						fontSize: `0.9rem`,
						display: `block`,
						lineHeight: `1.2`,
						visibility: `hidden`,
						whiteSpace: `pre-wrap`,
						height: `max-content`,
						width: `100%`
					},
					'& > button': {
						position: `absolute`,
						top: `100%`,
						left: `-1px`,
						opacity: `0`,
						transition: `opacity 200ms ease-out`,
						pointerEvents: `none`
					},
					'& textarea': {
						width: `100%`,
						height: `100%`,
						resize: `none`,
						display: `block`,
						background: `transparent`,
						border: `none`,
						fontSize: `0.9rem`,
						lineHeight: `1.2`,
						position: `absolute`,
						top: `0`,
						left: `0`,
						padding: `0.4rem`,
						color: data => data.editableTextColor,
						overflow: `hidden`,
						zIndex: `2`,
						'&:focus': {
							background: data => data.editableTextFocusBG,
							'& + button': {
								opacity: `1`,
								pointerEvents: `all`
							}
						}
					},
				}
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			editableTextBorder: `#bbb`,
			editableTextFocusBG: `#b0f0ff`,
			editableTextColor: `#333`
		}
	}
}