var CustomCompiler;
( function () {

    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;
    var factory = osgShader.nodeFactory;


    // this compiler use basic lighting and add a node to demonstrate how to
    // customize the shader compiler
    CustomCompiler = function () {
        osgShader.Compiler.apply( this, arguments );
    };


    CustomCompiler.prototype = osg.objectInherit( osgShader.Compiler.prototype, {


        // this is the main code that instanciate and link nodes together
        // it's a simplified version of the curent osgjs compiler
        // it could also be simpler
        createFragmentShaderGraph: function () {

            // no material then return a default shader
            // you could do whatever you want here
            // if you want to return a debug color
            // just to be sure that you always have
            // valid material in your scene, in our case we suppose
            // it exists in the scene
            // if ( !this._material )
            //     return this.createDefaultFragmentShaderGraph();

            var materialUniforms = this.getOrCreateStateAttributeUniforms( this._material );


            // that's the final result of the shader graph
            var fragColor = factory.getNode( 'FragColor' );


            // diffuse color
            // use texture if we have some, check code of Compiler
            // to see the default behaviour
            var diffuseColor = this.getDiffuseColorFromTextures();


            // no texture then we use the material diffuse value
            if ( diffuseColor === undefined ) {

                diffuseColor = materialUniforms.diffuse;

            } else {

                factory.getNode( 'InlineCode' )
                    .code( '%color.rgb *= %diffuse.rgb;' )
                    .inputs( {
                        diffuse: materialUniforms.diffuse
                    } )
                    .outputs( {
                        'color': diffuseColor
                    } );

            }


            if ( this._lights.length > 0 ) {

                // creates lights nodes
                var lightedOutput = this.createLighting();

                // ======================================================
                // my custom attribute ramp
                // it's here I connect ouput of light result with my ramp
                // ======================================================
                var rampResult = this.getOrCreateVariable( 'vec4' );
                var rampAttribute = this.getAttributeType( 'Ramp' );
                if ( rampAttribute && rampAttribute.getAttributeEnable() ) {

                    factory.getNode( 'Ramp' )
                        .inputs( lightedOutput )
                        .outputs( rampResult );

                } else {
                    rampResult = lightedOutput;
                }
                // ======================================================


                // ======================================================
                // my custom attribute negatif
                // it's here I connect ouput of light result with my ramp
                // ======================================================
                var negatifResult = this.getOrCreateVariable( 'vec4' );
                var negatifAttribute = this.getAttributeType( 'Negatif' );
                if ( negatifAttribute ) {

                    factory.getNode( 'Negatif' )
                        .inputs( {
                            input: rampResult,
                            enable: this.getOrCreateUniform( negatifAttribute.getOrCreateUniforms().enable )
                        } )
                        .outputs( negatifResult );

                } else {
                    negatifResult = rampResult;
                }
                // ======================================================


                // get final color
                // use the rampResult from previous node
                factory.getNode( 'Add' ).inputs( materialUniforms.emission, negatifResult ).outputs( fragColor );

            } else {

                // no lights use a default behaviour
                factory.getNode( 'InlineCode' )
                    .code( '%color.rgb = %diffuse.rgb;' )
                    .inputs( {
                        diffuse: diffuseColor
                    } )
                    .outputs( {
                        'color': fragColor
                    } );


            }

            return fragColor;
        }

    } );

} )();
