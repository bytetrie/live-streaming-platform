#include "context.hpp"

// Class helper functions

bool handleKeyUp( SDL_KeyboardEvent* key )
{
    bool quit = false;

    switch ( key->keysym.scancode )
    {
    case SDL_SCANCODE_ESCAPE:
        quit = true;
        break;
    default:
        break;
    }

    return quit;
}

void createWindowAndContext( SDL_Window*& window,
                             SDL_GLContext& context,
                             ContextExceptionType& ex )
{
    if ( SDL_Init( SDL_INIT_VIDEO ) < 0 )
    {
        ex = ContextExceptionType::noSDL;
        return;
    }

    SDL_GL_SetAttribute( SDL_GL_CONTEXT_PROFILE_MASK,
                         SDL_GL_CONTEXT_PROFILE_CORE );
    SDL_GL_SetAttribute( SDL_GL_CONTEXT_MAJOR_VERSION, 3 );
    SDL_GL_SetAttribute( SDL_GL_CONTEXT_MINOR_VERSION, 2 );

    window = SDL_CreateWindow( "DRAWCOLLAB",
                               SDL_WINDOWPOS_UNDEFINED,
                               SDL_WINDOWPOS_UNDEFINED,
                               800,
                               600,
                               SDL_WINDOW_OPENGL );

    if ( NULL == window )
    {
        ex = ContextExceptionType::noWindow;
        return;
    }

    context = SDL_GL_CreateContext( window );

    glewExperimental = GL_TRUE;
    glewInit( );
}

// Context class implementation

Context::Context( )
{
    window  = NULL;
    context = NULL;

    ContextExceptionType type;
    createWindowAndContext( window, context, type );

    if ( type )
    {
        throw type;
    }
}

void Context::checkGLErrors( )
{
    if ( SDL_GL_GetCurrentContext( ) != NULL )
    {
        GLenum err;
        while ( ( err = glGetError( ) ) != GL_NO_ERROR )
        {
            std::cout << "GL Error: " << err << std::endl;
        }
    }
    else
    {
        std::cout << "No GL Context." << std::endl;
    }
}

void Context::close( )
{
    std::cout << "Closing window." << std::endl;

    SDL_GL_DeleteContext( context );
    context = NULL;
    SDL_DestroyWindow( window );
    window = NULL;
    SDL_Quit( );
}

Context::~Context( )
{
    close( );
}

bool Context::loop( )
{
    SDL_Event event;

    bool quit    = false;
    bool visible = true;

    auto t_start = std::chrono::high_resolution_clock::now( );

    while ( !quit )
    {
        if ( SDL_PollEvent( &event ) )
        {
            switch ( event.type )
            {
            case SDL_QUIT:
                quit = true;
                break;
            case SDL_WINDOWEVENT:
                switch ( event.window.event )
                {
                case SDL_WINDOWEVENT_HIDDEN:
                    visible = false;
                    break;
                case SDL_WINDOWEVENT_SHOWN:
                    visible = true;
                    break;
                case SDL_WINDOWEVENT_FOCUS_LOST:
                    visible = false;
                    break;
                case SDL_WINDOWEVENT_FOCUS_GAINED:
                    visible = true;
                    break;
                case SDL_WINDOWEVENT_CLOSE:
                    quit = true;
                    break;
                }
                break;
            case SDL_KEYUP:
                quit = handleKeyUp( &event.key );
                break;
            default:
                break;
            }
        }

        if ( !visible )
        {
            SDL_WaitEvent( NULL );
        }
        else
        {
            auto t_now = std::chrono::high_resolution_clock::now( );
            time = std::chrono::duration_cast<std::chrono::duration<float>>(
                       t_now - t_start )
                       .count( );

            delegate->update( time ); // get bool/throw from this

            SDL_GL_SwapWindow( window );

            checkGLErrors( ); // throw/bool from this?

            // quit = true;
        }
    }

    std::cout << "Received exit call." << std::endl;

    return false;
}