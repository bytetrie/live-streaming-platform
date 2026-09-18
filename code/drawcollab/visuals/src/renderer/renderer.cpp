#include "renderer.hpp"
#include "shaders/shaders.hpp"

// Renderer class implementation

Renderer::Renderer( )
{
    sceneVertexShader = loadShaderFromFile(
        "resources/shaders/vertex/scene.vert", GL_VERTEX_SHADER );
    sceneFragmentShader = loadShaderFromFile(
        "resources/shaders/fragment/scene.frag", GL_FRAGMENT_SHADER );
    sceneShaderProgram =
        createShaderProgram( sceneVertexShader, sceneFragmentShader );

    glGenVertexArrays( 1, &vaoPoints );
    glGenBuffers( 1, &vboPoints );

    glBindVertexArray( vaoPoints );
    glBindBuffer( GL_ARRAY_BUFFER, vboPoints );

    glUseProgram( sceneShaderProgram );

    GLint posAttrib = glGetAttribLocation( sceneShaderProgram, "position" );
    glEnableVertexAttribArray( posAttrib );
    glVertexAttribPointer(
        posAttrib, 2, GL_FLOAT, GL_FALSE, 2 * sizeof( GLfloat ), 0 );

    glEnable( GL_PROGRAM_POINT_SIZE );
}

void Renderer::draw( float& time )
{
    glClearColor( 0.0f, 0.0f, 0.0f, 1.0f );
    glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

    delegate->rendererEvent_setVertexArray( vArrays );

    for ( int i = 0; i < vArrays.total; ++i )
    {
        // perhaps we want to know the largest array length and use 1 instance
        // of vertices array
        float vertices[ vArrays.arraySize[ i ] ];
        memcpy( vertices, vArrays.vertices[ i ], sizeof( vertices ) );

        glBindVertexArray( vaoPoints );

        glBindBuffer( GL_ARRAY_BUFFER, vboPoints );
        glBufferData(
            GL_ARRAY_BUFFER, sizeof( vertices ), vertices, GL_STATIC_DRAW );

        glUseProgram( sceneShaderProgram );

        glUniform3f( glGetUniformLocation( sceneShaderProgram, "color" ),
                     vArrays.color[ i * 3 ],
                     vArrays.color[ i * 3 + 1 ],
                     vArrays.color[ i * 3 + 2 ] );

        // glDrawArrays( GL_POINTS, 0, data.size * 0.5 );
        // glDrawArrays( GL_LINES, 0, data.size * 0.5 );
        glDrawArrays( GL_LINE_STRIP, 0, vArrays.arraySize[ i ] * 0.5 );
    }

    delegate->rendererEvent_onDrawCompleted( );
}

Renderer::~Renderer( )
{
    glDetachShader( sceneShaderProgram, sceneVertexShader );
    glDetachShader( sceneShaderProgram, sceneFragmentShader );

    glDeleteProgram( sceneShaderProgram );
    glDeleteShader( sceneFragmentShader );
    glDeleteShader( sceneVertexShader );

    glDeleteBuffers( 1, &vboPoints );
    glDeleteVertexArrays( 1, &vaoPoints );
}
