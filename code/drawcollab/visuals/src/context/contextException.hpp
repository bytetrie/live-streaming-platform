#ifndef CONTEXT_EXCEPTION_H
#define CONTEXT_EXCEPTION_H

#include <GL/glew.h>
#include <SDL2/SDL.h>
#include <SDL2/SDL_opengl.h>
#include <exception>

enum ContextExceptionType
{
    noSDL,
    noWindow
};

struct ContextException : public std::exception
{
    ContextExceptionType type;

    ContextException( ContextExceptionType _type )
    {
        type = _type;
    }

    void message( char* buffer ) const throw( )
    {
        switch ( type )
        {
        case noSDL:
            strcpy( buffer, "SDL could not initialize! SDL Error: " );
            strcat( buffer, SDL_GetError( ) );
            break;
        case noWindow:
            strcpy( buffer, "Window not created: " );
            strcat( buffer, SDL_GetError( ) );
            break;
        };
    }
};

#endif