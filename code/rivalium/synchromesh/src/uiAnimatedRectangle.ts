import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiAnimatedRectangle = `uiAnimatedRectangle`,
}

export enum AnimatedRectangleType
{
	grey,
	red,
	blue,
	rainbow,
	striped,
	gradient,
	noise
}

export interface UIAnimatedRectangleUpdateData
{
	type?: AnimatedRectangleType
	value?: number
	isAnimated?: boolean
}

export class UIAnimatedRectangle implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLCanvasElement

	public classes?: Record<CssClass, string>

	private context: CanvasRenderingContext2D

	private resizer: ResizeObserver

	private offset: number

	private previous: number

	private colorRef: Record<AnimatedRectangleType, string | CanvasGradient | CanvasPattern>

	constructor(
		private helper: UIMetaHelper,
		private type: AnimatedRectangleType = AnimatedRectangleType.grey,
		private fillAmount: number = 1,
		private isAnimated = false )
	{
		this.id = `UIAnimatedRectangle`

		if ( this.fillAmount > 1 ) throw Error( `Fill amount must be a number from 0 to 1` )

		this.draw = this.draw.bind( this )

		this.resize = this.resize.bind( this )

		this.el = el( `canvas` ) as HTMLCanvasElement

		this.resizer = new ResizeObserver( this.resize )

		this.resizer.observe( this.el )

		const context = this.el.getContext( `2d` )

		if ( !context ) throw Error( `Could not create rendering context` )

		this.offset = 0

		this.previous = 0

		this.context = context

		this.colorRef = {
			[ AnimatedRectangleType.grey ]: `#999`,
			[ AnimatedRectangleType.striped ]: `#999`,
			[ AnimatedRectangleType.blue ]: `#316aac`,
			[ AnimatedRectangleType.gradient ]: this.getGradient(),
			[ AnimatedRectangleType.rainbow ]: this.getRainbow(),
			[ AnimatedRectangleType.red ]: `#DC3C50`,
			[ AnimatedRectangleType.noise ]: this.getNoise()
		}

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiAnimatedRectangle )

		this.el.width = this.el.clientWidth

		this.el.height = this.el.clientHeight

		this.draw( 0 )
	}

	private getGradient()
	{
		const gradient = this.context.createLinearGradient( 0, 0, this.el.clientWidth, this.el.clientHeight )

		gradient.addColorStop( 0, `#96D732` )

		gradient.addColorStop( 0.85, `#EBD700` )

		gradient.addColorStop( 0.95, `#DC3C50` )

		gradient.addColorStop( 1, `#DC3C50` )

		return gradient
	}

	private getRainbow()
	{
		const gradient = this.context.createLinearGradient( 0, 0, this.el.clientWidth, this.el.clientHeight )

		gradient.addColorStop( 0, `#DC3C50` )

		gradient.addColorStop( 0.4, `#EBD700` )

		gradient.addColorStop( 0.55, `#96D732` )

		gradient.addColorStop( 0.7, `#50CDE1` )

		gradient.addColorStop( 0.85, `#316aac` )

		gradient.addColorStop( 1, `#CD50D7` )

		return gradient
	}

	private getNoise()
	{
		const patternCanvas = document.createElement( `canvas` )

		const patternContext = patternCanvas.getContext( `2d` )

		if ( !patternContext ) throw Error( `No pattern context` )

		patternCanvas.width = 100

		patternCanvas.height = 100

		patternContext.beginPath()

		patternContext.fillStyle = `white`

		patternContext.fillRect( 0, 0, patternCanvas.width, patternCanvas.height )

		patternContext.closePath()

		const sqr = 5

		for ( let x = 0; x < patternCanvas.width; x += sqr )
		{
			for ( let y = 0; y < patternCanvas.height; y += sqr )
			{
				patternContext.beginPath()

				const grey = Math.random() * 150 + 90

				patternContext.fillStyle = `rgb(${grey}, ${grey}, ${grey})`

				patternContext.fillRect( x, y, sqr, sqr )

				patternContext.closePath()
			}
		}

		const pattern = this.context.createPattern( patternCanvas, `` )

		if ( !pattern ) throw Error( `No pattern` )

		return pattern
	}

	private resize()
	{
		this.el.width = this.el.clientWidth

		this.el.height = this.el.clientHeight

		this.colorRef[ AnimatedRectangleType.gradient ] = this.getGradient()

		this.colorRef[ AnimatedRectangleType.rainbow ] = this.getRainbow()

		this.draw( 0 )
	}

	private draw( time: number )
	{
		this.context.clearRect( 0, 0, this.el.clientWidth, this.el.clientHeight )

		this.context.fillStyle = this.colorRef[ this.type ]

		this.context.fillRect( 0, 0, this.fillAmount * this.el.clientWidth, this.el.clientHeight )

		if ( this.type === AnimatedRectangleType.striped )
		{
			this.context.setLineDash( [ 20, 20 ] )

			this.context.beginPath()

			this.context.strokeStyle = `#ccc`

			this.context.lineDashOffset = this.offset

			const delta = time - this.previous

			this.previous = time

			this.offset = this.offset >= 40 ? 0 : this.offset + ( delta * 0.1 )

			this.context.lineWidth = this.el.clientHeight

			this.context.moveTo( 0, this.el.clientHeight * 0.5 )

			this.context.lineTo( this.fillAmount * this.el.clientWidth, this.el.clientHeight * 0.5 )

			this.context.stroke()
		}

		if ( this.isAnimated ) requestAnimationFrame( this.draw ) 
	}

	public update( { isAnimated, type, value }: UIAnimatedRectangleUpdateData ): this
	{
		if ( value !== undefined && value > 1 )
		{
			throw Error( `Value must be a number from 0 to 1` )
		}

		if ( type && this.type !== type )
		{
			this.type = type
		}

		if ( value !== undefined ) this.fillAmount = value

		const drawing = this.isAnimated

		if ( isAnimated !== undefined ) this.isAnimated = isAnimated

		if ( !drawing ) this.draw( 0 )

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiAnimatedRectangle: {
				width: `100%`,
				height: `100%`,
				background: `transparent`
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}