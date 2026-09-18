#include "app.hpp"
#include "../context/context.hpp"
#include "../context/contextException.hpp"

App::App( )
{
    r.delegate = this;
    c.delegate = this;
}

bool App::run( )
{
    try
    {
        if ( !c.loop( ) )
        {
            return true;
        }
    }
    catch ( ContextException& e )
    {
        std::cout << "Context exception caught." << std::endl;

        char buffer[ 100 ];

        e.message( buffer );
        std::cout << buffer << std::endl;

        return false;
    }

    return false;
}

// Render Delegate methods

void App::rendererEvent_setVertexArray( VertexArrays& vArray )
{
    if ( d.lock )
    {
        return;
    }

    d.lock = true;

    // VertexArrays* v = &setVertexArray;

    std::cout << d.totalBufferSize << std::endl;
    std::cout << d._users << std::endl;
    std::cout << d.users << std::endl;

    /*
    memcpy(
        vArray.vertices,
        d.buff,
        d.totalBufferSize * sizeof( float ) +
            ( ( d._users - d.users ) * sizeof( float ) ) ); // cumulative total
    memcpy( vArray.arraySize, d.size, d._users * sizeof( int ) );
    */

    // int* x = d.size;

    // TODO: assign memory to vertices/etc

    // **vArray.vertices = **d.buff;
    // *vArray.arraySize = *d.size;
    std::cout << "copied 1" << std::endl;

    // memcpy( vArray.vertices,
    //         d.buff,
    //         d.totalBufferSize * sizeof( float ) ); // cumulative total
    // memcpy( vArray.arraySize, d.size, d.users * sizeof( int ) );
    // memcpy( v->total, d.users, sizeof d.users );

    // v->vertices  = d.buff;
    // v->arraySize = d.size;
    // vArray.total = d.users;
    vArray.total = 0;
    // vArray.total = d.users; // works but then fails at render time due to
    // trying to read empty vArray vertex memory

    std::cout << "copied 2" << std::endl;
}

void App::rendererEvent_onDrawCompleted( )
{
    d.lock = false;
}

// Context Delegate methods

void App::update( float& time ) // bool/throw?
{
    d.update( ); // slowing things down?

    r.draw( time ); // only needs to happen ~60 times per second
}
