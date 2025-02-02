import * as pc from 'playcanvas';

/**
 * @typedef {import('../../options.mjs').ExampleOptions} ExampleOptions
 * @param {import('../../options.mjs').ExampleOptions} options - The example options.
 * @returns {Promise<pc.AppBase>} The example application.
 */
async function example({ canvas, deviceType, assetPath, scriptsPath, glslangPath, twgslPath, pcx, files }) {

    const gfxOptions = {
        deviceTypes: [deviceType],
        glslangUrl: glslangPath + 'glslang.js',
        twgslUrl: twgslPath + 'twgsl.js'
    };

    const device = await pc.createGraphicsDevice(canvas, gfxOptions);
    const createOptions = new pc.AppOptions();
    createOptions.graphicsDevice = device;
    createOptions.mouse = new pc.Mouse(document.body);
    createOptions.touch = new pc.TouchDevice(document.body);

    createOptions.componentSystems = [
        // @ts-ignore
        pc.RenderComponentSystem,
        // @ts-ignore
        pc.CameraComponentSystem,
        // @ts-ignore
        pc.LightComponentSystem,
        // @ts-ignore
        pc.ScriptComponentSystem
    ];
    createOptions.resourceHandlers = [
        // @ts-ignore
        pc.TextureHandler,
        // @ts-ignore
        pc.ContainerHandler,
        // @ts-ignore
        pc.ScriptHandler
    ];

    const app = new pc.AppBase(canvas);
    app.init(createOptions);

    pcx.registerPlyParser(app);

    // Set the canvas to fill the window and automatically change resolution to be the same as the canvas size
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Ensure canvas is resized when window changes size
    const resize = () => app.resizeCanvas();
    window.addEventListener('resize', resize);
    app.on('destroy', () => {
        window.removeEventListener('resize', resize);
    });

    const assets = {
        biker: new pc.Asset('splat', 'container', { url: assetPath + 'splats/biker.ply' }),
        orbit: new pc.Asset('script', 'script', { url: scriptsPath + 'camera/orbit-camera.js' })
    };

    const assetListLoader = new pc.AssetListLoader(Object.values(assets), app.assets);
    assetListLoader.load(() => {

        app.start();

        // Create an Entity with a camera component
        const camera = new pc.Entity();
        camera.addComponent("camera", {
            clearColor: new pc.Color(0.2, 0.2, 0.2)
        });
        camera.setLocalPosition(2, 1, 1);

        const createSplatInstance = (resource, px, py, pz, scale, vertex, fragment) => {

            const splat = resource.instantiateRenderEntity({
                cameraEntity: camera,
                debugRender: false,
                fragment: fragment,
                vertex: vertex
            });
            splat.setLocalPosition(px, py, pz);
            splat.setLocalScale(scale, scale, scale);
            app.root.addChild(splat);
            return splat;
        };

        const biker = createSplatInstance(assets.biker.resource, -1.5, 0.05, 0, 0.7);

        // add orbit camera script with a mouse and a touch support
        camera.addComponent("script");
        camera.script.create("orbitCamera", {
            attributes: {
                inertiaFactor: 0.2,
                focusEntity: biker,
                distanceMax: 60,
                frameOnStart: false
            }
        });
        camera.script.create("orbitCameraInputMouse");
        camera.script.create("orbitCameraInputTouch");
        app.root.addChild(camera);
    });
    return app;
}

export class SplatExample {
    static CATEGORY = 'Loaders';
    static example = example;
}
