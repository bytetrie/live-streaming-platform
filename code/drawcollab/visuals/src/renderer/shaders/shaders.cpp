#include "shaders.hpp"

// For debugging shaders
void handleShaderError( GLuint& shader, const char* filename )
{
    GLint status;
    glGetShaderiv( shader, GL_COMPILE_STATUS, &status );
    if ( status != GL_TRUE )
    {
        char buffer[ 512 ];
        glGetShaderInfoLog( shader, 512, NULL, buffer );
        std::cerr << "Failed to compile shader: " << filename << std::endl;
        std::cerr << buffer << std::endl;
    }
}

// Returns compiled shader for use in program
GLuint loadShaderFromFile( const char* filename, GLenum shaderType )
{
    std::ifstream file( filename );
    if ( !file )
    {
        std::cerr << "Unable to open file: " << filename << std::endl;
        return 0;
    }

    char line[ 256 ];
    std::string source;

    while ( file )
    {
        if ( file.eof( ) )
        {
            break;
        }

        file.getline( line, 256 );
        source += line;
        source += '\n';
    }

    if ( !file.eof( ) )
    {
        std::cerr << "Error reading the file: " << filename << std::endl;
        return 0;
    }

    GLuint shader = glCreateShader( shaderType );

    const char* parseableSource = source.c_str( );
    glShaderSource( shader, 1, &parseableSource, NULL );

    glCompileShader( shader );

    handleShaderError( shader, filename );

    return shader;
}

// Given a vert and frag shader, compiles and returns shader program int
GLuint createShaderProgram( GLuint& vertexShader, GLuint& fragmentShader )
{
    GLint status;
    GLuint shaderProgram = glCreateProgram( );

    glAttachShader( shaderProgram, vertexShader );
    glAttachShader( shaderProgram, fragmentShader );

    glLinkProgram( shaderProgram );
    glGetProgramiv( shaderProgram, GL_LINK_STATUS, &status );

    if ( status != GL_TRUE )
    {
        std::cerr << "Failed to link shaders: " << std::endl;
        GLchar log[ 512 ];
        glGetProgramInfoLog( shaderProgram, 512, NULL, log );
        std::cerr << log << std::endl;
    }

    return shaderProgram;
}