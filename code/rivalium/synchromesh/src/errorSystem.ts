/**
 * TODO:
 * - error formatting, categorising
 * - handler to output to UI
 * - possibly, send errors to server
 */
export class ErrorSystem
{
	// client-side silenting
	private silent: boolean

	private errors: {date: Date, error: Error | ErrorEvent}[]

	constructor()
	{
		this.getLast = this.getLast.bind( this )

		this.silent = false

		this.errors = []

		window.sychromesh.errors = {
			getLast: this.getLast
		}
	}

	private getLast( amount = 1 )
	{
		for ( let i = 0; i < amount; i++ )
		{
			this.publish( this.errors.length - ( 1 + i ) )
		}
	}

	private publish( index: number )
	{
		if ( this.silent ) return

		const { date, error } = this.errors[ index ]

		console.warn( `Following error receieved on `, date )

		console.error( error )
	}

	public error( error: string | Error | ErrorEvent ): void
	{
		const e = typeof error === `string`
			? Error( error )
			: error

		this.errors.push( { date: new Date(), error: e } )

		this.getLast()
	}
}