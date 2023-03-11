/**
 * Wraps a canvas to add more convenient methods.
 * @class
 */
export class Canvas {
    /**
     * @param {*} [args] If Canvas, the object to be cloned; if Image, the image whose dimensions and data will be inherited; if string, the CSS query to 
     *     target a canvas; if the HTMLCanvasElement, the canvas element to be wrapped; if number or void, the (width, height) of the new canvas.
     * @returns {Canvas} The new wrapper.
     */  
    constructor(...args) {
        // Create a canvas object out of a canvas object
        if (args[0] instanceof Canvas) {
            return args[0].clone();
        }

        else if (args[0] instanceof HTMLCanvasElement) {
            this.canvas = args[0];
            this.context = args[0].getContext("2d");
        }

        // Create a canvas object out of a img element
        else if (args[0] instanceof Image) {
            return new Canvas(args[0].width, args[0].height).image(args[0]);
        }

        // Create a canvas object out of a canvas element
        else if (typeof args[0] === "string") {
            return new Canvas(document.querySelector(args[0]));
        }

        // Create a canvas object out of an array of dimensions
        else if (Array.isArray(args[0])) {
            return new Canvas(...args.map(parseFloat));
        }

        // Create a new canvas element with given dimensions
        else {
            this.canvas = document.createElement("canvas");
            this.context = this.canvas.getContext("2d");

            args[0] = valuecheck(args[0], { nan: 300 });
            args[1] = valuecheck(args[1], { nan: 150 });

            this.width(args[0]).height(args[1]);
        }
    }
    
    /**
     * Tests if the data of an ImageData is fully transparent.
     * @param {Array} arr The ImageData's data array.
     * @returns {boolean}
     */
    static imageDataIsEmpty(arr) {
        let r = true;
        for (let i = 3; i < arr.length; i += 4) {
            if (arr[i] !== 0) {
                r = false;
                break;
            }
        }
        return r;
    }


    // Gett sett

    /**
     * Gets or sets the width of the canvas.
     * @param {(number|void)} [width=1] The number to which the canvas's width should be set. Void to return the 
     *     current width.
     * @returns {(Canvas|number)}
     */
    width(width) {
        if (width === undefined) return this.canvas.width;

        this.canvas.width = valuecheck(width, { min: 1, integer: true });
        return this;
    }

    /**
     * Gets or sets the height of the canvas.
     * @param {(number|void)} [height=1] The number to which the canvas's height should be set. Void to return the 
     *     current height.
     * @returns {(Canvas|number)}
     */
    height(height) {
        if (height === undefined) return this.canvas.height;

        this.canvas.height = valuecheck(height, { min: 1, integer: true });
        return this;
    }

    /**
     * Shorthand for the `width` and `height` properties.
     * @returns {(Canvas|number[])}
     */
    size(width, height) {
        if (width === undefined && height === undefined) {
            return [this.width(), this.height()];
        }

        if (width) {
            this.width(width);
        }
        if (height) {
            this.height(height);
        }

        return this;
    }

    /**
     * Gets or sets the fillStyle of the canvas.
     * @param {(string|CanvasGradient|CanvasPattern|void)} [fillStyle] The style to which the canvas's fillStyle 
     *     should be set. Void to return the current fillStyle.
     * @returns {(Canvas|string|CanvasGradient|CanvasPattern)}
     */
    fillStyle(fillStyle) {
        if (fillStyle === undefined) return this.context.fillStyle;

        this.context.fillStyle = fillStyle;
        return this;
    }

    /**
     * Gets or sets the strokeStyle of the canvas.
     * @param {(string|CanvasGradient|CanvasPattern|void)} [strokeStyle] The style to which the canvas's 
     *     strokeStyle should be set. Void to return the current strokeStyle.
     * @returns {(Canvas|string|CanvasGradient|CanvasPattern)}
     */
    strokeStyle(strokeStyle) {
        if (strokeStyle === undefined) return this.context.strokeStyle;

        this.context.strokeStyle = strokeStyle;
        return this;
    }

    /**
     * Sets both the fillStyle and strokeStyle of the canvas or gets the strokeStyle.
     * @param {(string|CanvasGradient|CanvasPattern|void)} [style] The style to which the canvas's fillStyle and 
     *     strokeStyle should be set. Void to return the current strokeStyle.
     * @returns {(Canvas|string|CanvasGradient|CanvasPattern)}
     */
    style(style) {
        if (style === undefined) return this.context.strokeStyle;

        this.fillStyle(style).strokeStyle(style);
        return this;
    }

    /**
     * Gets or sets the lineCap of the canvas.
     * @param {(string|void)} [cap] The value to which the canvas's lineCap should be set. Void to return the 
     *     current lineCap.
     * @returns {(Canvas|string)}
     */
    cap(cap) {
        if (cap === undefined) return this.context.lineCap;

        this.context.lineCap = cap;
        return this;
    }

    /**
     * Gets or sets the lineJoin of the canvas.
     * @param {(string|void)} [joint] The value to which the canvas's lineJoin should be set. Void to return the 
     *     current lineJoin.
     * @returns {(Canvas|string)}
     */
    joint(joint) {
        if (joint === undefined) return this.context.lineJoin;

        this.context.lineJoin = joint;
        return this;
    }

    /**
     * Gets or sets the lineWidth of the canvas.
     * @param {(number|void)} [width] The size to which the canvas's lineWidth should be set. Void to return the 
     *     current lineWidth.
     * @returns {(Canvas|number)}
     */
    strokeWidth(width) {
        if (width === undefined) return this.context.lineWidth;

        this.context.lineWidth = width;
        return this;
    }

    /**
     * Gets or sets the globalCompositeOperation of the canvas.
     * @param {(string|void)} [joint] The value to which the canvas's globalCompositeOperation should be set. Void 
     *     to return the current globalCompositeOperation.
     * @returns {(Canvas|string)}
     */
    gco(gco) {
        if (gco === undefined) return this.context.globalCompositeOperation;
        
        this.context.globalCompositeOperation = gco;
        return this;
    }

    /**
     * Gets or sets the globalAlpha of the canvas.
     * @param {(number|void)} [joint] The alpha inclusively between 0 and 255 to which the canvas's globalAlpha 
     *     should be set. Void to return the current globalAlpha.
     * @returns {(Canvas|number)}
     */
    alpha(alpha) {
        if (alpha === undefined) return this.context.globalAlpha;

        this.context.globalAlpha = alpha / 255;
        return this;
    }

    font(family, size, {style, weight, stretch, lineHeight}={}) {
        if (family === undefined) return this.context.font;
        
        const font = new CanvasFont({style, weight, stretch, size, lineHeight, family}).toString();
        this.context.font = font;

        if (this.context.font !== font) {
            this.context.font = family;
        }

        return this;
    }

    textAlign(align) {
        if (align === undefined) return this.context.textAlign;
        
        this.context.textAlign = align;
        return this;
    }

    textBaseline(baseline) {
        if (baseline === undefined) return this.context.textBaseline;
        
        this.context.textBaseline = baseline;
        return this;
    }

    charSpacing(spacing) {
        if (spacing === undefined) return this.canvas.style.letterSpacing;

        this.canvas.style.letterSpacing = spacing;
        return this;
    }

    copyDims(canvas) {
        this.size(canvas.width(), canvas.height());
        return this;
    }

    shadowColor(color) {
        if (color === undefined) return this.context.shadowColor;

        this.context.shadowColor = color;
        return this;
    }

    shadowBlur(level) {
        if (level === undefined) return this.context.shadowBlur;

        this.context.shadowBlur = level;
        return this;
    }

    /**
     * Calculates the offset and dimensions of the smallest possible rectangle that can contain all nontransparent 
     *     content on the canvas.
     * @async
     * @returns {TrimmingRect}
     */
    async getTrimming() { // for cutting the transparent edges off the canvas and downsizing it
        for (let top = 0; this.rowIsTransparent(top); top++);
    
        let left;
        let width;
        let height;
        if (top === this.height()) { // ...then the entire image is empty. No need to iterate.
            top = NaN;
            left = NaN;
            width = 0;
            height = 0;
        } else {
            for (let bottom = this.height(); this.rowIsTransparent(bottom - 1); bottom--);
            for (left = 0; this.colIsTransparent(left); left++);
            for (let right = this.width(); this.colIsTransparent(right - 1); right--);

            height = bottom - top;
            width = right - left;
        }

        return new TrimmingRect(left, top, width, height);
    }

    /**
     * Gives an array containing two starting zeroes and the canvas's dimensions, intended to be spread onto a 
     *     context method used to cover the entire canvas.
     * @returns {Array}
     */
    dims() {
        return [0, 0, this.width(), this.height()];
    }

    widthHalf() {
        return Math.floor(this.width() / 2);
    }

    heightHalf() {
        return Math.floor(this.height() / 2);
    }

    sizeHalf() {
        return [this.widthHalf(), this.heightHalf()];
    }


    // Instant figure drawers

    instRect(x=0, y=0, w=this.width(), h=this.height(), fillStyle) {
        if (fillStyle) this.fillStyle(fillStyle);

        this.context.fillRect(x, y, w, h);
        return this;
    }

    /**
     * Begins a new path and constructs a segment on the canvas.
     * @param {number} x1 Horizontal offset of the first endpoint of the segment.
     * @param {number} y1 Vertical offset of the first endpoint of the segment.
     * @param {number} x2 Horizontal offset of the second endpoint of the segment.
     * @param {number} y2 Vertical offset of the second endpoint of the segment.
     * @returns {Canvas}
     */
    instLine(x1, y1, x2, y2) {
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
        return this;
    }

    /**
     * Begins a new path and constructs a circle on the canvas.
     * @param {number} x Horizontal offset of the center of the circle.
     * @param {number} y Vertical offset of the center of the circle.
     * @param {number} r Distance of each point from the center of the circle.
     * @returns {Canvas}
     */
    instCircle(x, y, r) {
        this.context.beginPath();
        this.context.arc(x, y, r, 0, 2 * Math.PI);
        this.context.stroke();
        return this;
    }

    instEllipse(x, y, a, b) {
        this.context.beginPath();
        this.context.ellipse(x, y, a, b, 0, 0, 2 * Math.PI);
        this.context.stroke();
        return this;
    }

    write(text, x=this.widthHalf(), y=this.heightHalf(), maxWidth) {
        this.context.fillText(text, x, y, maxWidth);
        return this;
    }

    continuousWriter(x, y, ...pairs) {
        this.save();
        for (let [text, fn] of pairs) {
            if (fn) fn(this);

            this.write(text, x, y);
            x += this.measureText(text).width;
        }
        this.restore();
        return this;
    }


    // Path contiuation drawers (Assumes path is started already)

    /**
     * Constructs a quadratic beziér curve on the canvas, continuing the already begun path.
     * @param {number} x1 Horizontal offset of the first endpoint of the quadratic curve.
     * @param {number} y1 Vertical offset of the first endpoint of the quadratic curve.
     * @param {number} x2 Horizontal offset of the second endpoint of the quadratic curve.
     * @param {number} y2 Vertical offset of the second endpoint of the quadratic curve.
     * @returns {Canvas}
     */
    qCurve(x1, y1, x2, y2) {
        const midpoint = quadraticMidpoint(x1, y1, x2, y2);

        this.context.quadraticCurveTo(x1, y1, midpoint.x, midpoint.y);

        return this;
    }

    
    // Full path drawers

    /**
     * Begins a new path and constructs a set of quadratic beziér curves on the canvas using a given set of points.
     * @param {Point[]} points List of path points.
     * @returns {Canvas}
     */
    qCurvePath(points) {
        this.pathStart();
        this.context.moveTo(...points[0]);

        for (let i = 1; i < points.length - 1; i++) {
            const [p1, p2] = [points[i], points[i + 1]];

            this.qCurve(...p1, ...p2);

            /*/ Connecting with nearby points
            for (let j = 0; j < i; j++) {
                const dist = Math.sqrt((p1.x - points[j].x) ** 2 + (p1.y - points[j].y) ** 2);

                if (dist < settings.strokeWidth * 2) {
                    this.context.lineTo(...points[j]);
                    this.context.moveTo(...p1);
                }
            }*/
        }

        this.context.lineTo(...points[points.length - 1]);
        this.context.stroke();

        return this;

        // technique stolen from http://perfectionkills.com/exploring-canvas-drawing-techniques/#bezier-curves
    }

    pathStart() {
        this.context.beginPath();
        return this;
    }

    pathArc(x=0, y=0, r=1, initialAngle=0, terminalAngle=2 * Math.PI, anticlockwise=false) {
        r = valuecheck(Math.abs(r), { nan: 1 });
        
        this.context.arc(x, y, r, initialAngle, terminalAngle, anticlockwise);
        return this;
    }

    pathFill(style) {
        if (style) this.fillStyle(style);

        this.context.fill();
        return this;
    }

    pathClip() {
        this.context.clip();
        return this;
    }
    
    // Other drawers

    image(image, ...drawImageArgs) {
        if (image instanceof Canvas) {
            image = image.canvas;
        }

        while (drawImageArgs.length < 2) {
            drawImageArgs.push(0);
        }

        this.context.drawImage(image, ...drawImageArgs);

        return this;
    }

    paste(target, ...drawImageArgs) {
        target.image(this, ...drawImageArgs);
        return this;
    }

    imageData(data, ...putImageDataArgs) {
        while (putImageDataArgs.length < 2) {
            putImageDataArgs.push(0);
        }

        this.context.putImageData(data, ...putImageDataArgs);

        return this;
    }
    
    /**
     * Fills the canvas with the current fillStyle.
     * @returns {Canvas}
     */
    cover(style) {
        if (style) this.fillStyle(style);

        this.context.fillRect(...this.dims());
        return this;
    }

    /**
     * Cuts or expands the canvas while retaining its content and style settings.
     * @param {number} x Horizontal offset of the top-left corner of the trimming rectangle.
     * @param {number} y Vertical offset of the top-left corner of the trimming rectangle.
     * @param {number} w Width of the trimming rectangle.
     * @param {number} h Height of the trimming rectangle.
     * @returns {Canvas}
     */
    crop(x, y, w, h) {
        const data = this.toImageData(x, y, w, h);

        this.context.save();

        this.width(w);
        this.height(h);

        this.context.restore();

        this.imageData(data, -x, -y);

        return this;
    }

    /**
     * Tests if a one-pixel-high slice of a canvas is fully transparent.
     * @param {number} offset Vertical offset of the row to test.
     * @returns {boolean}
     */
    rowIsTransparent(offset) {
        if (offset < 0 || offset >= this.height()) {
            return false;
        }

        const row = this.toImageData(0, offset, this.width(), 1).data;
        return Canvas.imageDataIsEmpty(row);
    }

    /**
     * Tests if a one-pixel-wide slice of a canvas is fully transparent.
     * @param {number} offset Horizontal offset of the column to test.
     * @returns {boolean}
     */
    colIsTransparent(offset) {
        if (offset < 0 || offset >= this.width()) {
            return false;
        }

        const col = this.toImageData(offset, 0, 1, this.height()).data;
        return Canvas.imageDataIsEmpty(col);
    }

    
    // Filters

    filterConvolution(weightsMatrix) { // TODO: WebWorker pls
        // alg adapted from https://www.html5rocks.com/en/tutorials/canvas/imagefilters/

        const matrixDim = Math.sqrt(weightsMatrix.length);
        if (matrixDim !== Math.floor(matrixDim)) throw new RangeError("Provided weight matrix is not a square");
        if (matrixDim === 0) return this;

        const halfMatrixDim = Math.floor(matrixDim / 2);

        const imageData = this.toImageData();
        const resultImageData = this.createImageData();

        // each pixel
        for (let x = 0; x < imageData.width; x++) {
            for (let y = 0; y < imageData.height; y++) {
                const channelSums = [0, 0, 0];
                // each element of the convolution matrix
                for (let convBoxX = 0; convBoxX < matrixDim; convBoxX++) {
                    for (let convBoxY = 0; convBoxY < matrixDim; convBoxY++) {
                        // where each element of the convolution matrix falls on the image
                        const convBoxImageX = x + convBoxX - halfMatrixDim;
                        const convBoxImageY = y + convBoxY - halfMatrixDim;
                        if (convBoxImageX < 0 || convBoxImageX >= imageData.width || convBoxImageY < 0 || convBoxImageY >= imageData.height) continue;

                        const srcIndexOffset = 4 * (convBoxImageY * imageData.width + convBoxImageX);
                        const targetWeight = weightsMatrix[convBoxY * matrixDim + convBoxX];
                        for (let i = 0; i < 3; i++) {
                            channelSums[i] += imageData.data[srcIndexOffset + i] * targetWeight;
                        }
                    }
                }
        
                const resultIndexOffset = 4 * (y * imageData.width + x);
                for (let i = 0; i < 3; i++) {
                    resultImageData.data[resultIndexOffset + i] = channelSums[i];
                }
                resultImageData.data[resultIndexOffset + 3] = 255;
            }
        }

        this.imageData(resultImageData);
        return this;
    }

    /**
     * Tests the transparency of each pixel on the canvas and sets it to either fully transparent or fully opaque depending on its position relative to a 
     * given threshold.
     * @param {number} [threshold=127] Alpha threshold which pixels with alpha values that place above will become fully opaque.
     * @returns {Canvas}
     */
    async alias(threshold=127) { 
        const imageData = this.toImageData();

        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > threshold) {
                imageData.data[i] = 255;
            } else {
                imageData.data[i] = 0;
            }
        }

        this.imageData(imageData);

        return this;
    }


    // Exporting

    /**
     * Exports the canvas as a data URL.
     * @param {string} [...args] Any arguments to be passed to `.toDataURL`.
     * @returns {string}
     */
    toSrc(...args) {
        return this.canvas.toDataURL(...args);
    }

    /**
     * Creates an HTMLImageElement from the canas.
     * @param {function} [onload] The callback to be run when the image finished loading.
     * @param {string} [...toSrcArgs] Any arguments to be passed to `.toDataURL`.
     * @returns {Image}
     */
    toImage(onload, ...toSrcArgs) {
        return newImage(this.toSrc(...toSrcArgs), onload);
    }

    toImageData(x=0, y=0, w=this.width(), h=this.height()) {
        return this.context.getImageData(x, y, w, h);
    }

    // Other

    clear() {
        this.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(...this.dims());
        this.restore();
        return this;
    }

    /**
     * Creates a new Canvas wrapper with the same content and dimensions.
     * @returns {Canvas}
     */
    clone() {
        const data = this.toImageData();

        return new Canvas(this.width(), this.height())
            .imageData(data);
    }

    translate(x, y) {
        this.context.translate(x, y);
        return this;
    }

    scale(x, y) {
        if (y === undefined) y = x;
        
        this.context.scale(x, y);
        return this;
    }

    rotate(a) {
        this.context.rotate(a);
        return this;
    }

    skew(x, y) {
        this.context.transform(1, Math.tan(y), Math.tan(x), 1, 0, 0);
        return this;
    }

    resetTransform() {
        this.context.resetTransform();
        return this;
    }

    imageSmoothing(value) {
        if (value === undefined) return this.context.imageSmoothingEnabled;
        
        this.context.imageSmoothingEnabled = Boolean(value);
        return this;
    }

    createImageData(arg1=this.width(), arg2=this.height()) {
        return this.context.createImageData(arg1, arg2);
    }

    save() {
        this.context.save();
        return this;
    }

    restore() {
        this.context.restore();
        return this;
    }

    iteratePixels(callback, x, y, w, h) {
        const imageData = this.toImageData(x, y, w, h);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            callback(data.slice(i, i + 4), i, imageData);
        }

        return imageData;
    }

    totalColorWeighted(x, y, w, h) {
        let [rt, gt, bt, at] = [0, 0, 0, 0];

        this.iteratePixels(([r, g, b, a]) => {
            if (a === 0) return;

            rt += r * a / 255;
            gt += g * a / 255;
            bt += b * a / 255;
            at += a / 255;
        }, x, y, w, h);

        return [rt, gt, bt, at];
    }

    averageColor(x, y, w, h) {
        let [rt, gt, bt] = [0, 0, 0, 0];

        this.iteratePixels(([r, g, b]) => {
            rt += r;
            gt += g;
            bt += b;
        }, x, y, w, h);

        return [rt / (w * h), gt / (w * h), bt / (w * h)];
    }

    averageColorWeighted(x, y, w, h) {
        const [rt, gt, bt, at] = this.totalColorWeighted(x, y, w, h);
        return [rt / at, gt / at, bt / at];
    }

    measureText(text) {
        return this.context.measureText(text);
    }

    reset() {
        return this.clear().resetTransform().style("#000").font("Arial", "12px");
    }
}

export class Point {
    constructor(x, y, time) {
        this.x = valuecheck(x, { integer: true, nan: 0 });
        this.y = valuecheck(y, { integer: true, nan: 0 });
        this.time = new Date(time);
    }

    differenceX(second) {
        return second.x - this.x;
    }

    differenceY(second) {
        return second.y - this.y;
    }

    slope(second) {
        return this.differenceY(second) / this.differenceX(second);
    }

    distance(second) {
        return Math.sqrt(this.differenceX(second) ** 2 + this.differenceY(second) ** 2);
    }

    // range limited to [−π/2, π/2]
    slopeAngle(second) {
        return Math.atan(this.slope(second));
    }

    // range limited to [−π, π]
    principalAngle(second) {
        return Math.atan2(this.differenceY(second), this.differenceX(second));
    }

    elapsedTime(second) {
        return second.time - this.time;
    }

    equivalent(second) {
        return this.x === second.x && this.y === second.y;
    }

    *[Symbol.iterator]() {
        yield* [this.x, this.y];
    }
}

export function P(x, y, time) {
    return new Point(x, y, time);
}

export class TrimmingRect {
    constructor(x=NaN, y=NaN, width=0, height=0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    *[Symbol.iterator]() {
        yield* [this.x, this.y, this.width, this.height];
    }

    isEmpty() {
        return isNaN(this.x) || isNaN(this.y);
    }

    merge(merger) {
        if (this.isEmpty() && merger.isEmpty()) {
            return new TrimmingRect();
        } else if (this.isEmpty()) {
            return new TrimmingRect(...merger);
        } else if (merger.isEmpty()) {
            return new TrimmingRect(...this);
        }

        const x = Math.min(this.x, merger.x);
        const y = Math.min(this.y, merger.y);

        const width = this.x + this.width > merger.x + merger.width ?
            this.x + this.width - x :
            merger.x + merger.width - x;

        const height = this.y + this.height > merger.y + merger.height ?
            this.y + this.height - y :
            merger.y + merger.height - y;

        return new TrimmingRect(x, y, width, height);
    }
}

function quadraticMidpoint(x1, y1, x2, y2) {
    const x = (x2 - x1) / 2 + x1;
    const y = (y2 - y1) / 2 + y1;

    return { x, y };
}

function newImage(src, onload) {
    const image = new Image();

    if (onload) {
        image.addEventListener("load", event => {
            onload(image, event);
        }, { once: true });
    }

    image.src = src;
    return image;
}

const valuecheck = (function () {
    /**
     * @function valuecheck
     * @param {(number|string)} value The value to be checked.
     * @param {Object} [options] Restrictions or default values used when checking the value.
     * @param {number} [options.percentageRatio=100] The ratio by which, if the value is a string of the form `"<n>%"`, 
     *     `n` will be multiplied.
     * @param {number} [options.min] The lowest possible value, inclusive.
     * @param {number} [options.max] The greatest possible value, inclusive.
     * @param {boolean} [options.integer=false] Whether to floor the value.
     * @param {boolean} [options.number=true] Whether to allow `NaN` as a final result.
     * @param {number} [options.nan=options.min || 0] The value to use in the case of an `NaN`, if `options.number` 
     *     is true.
     * @param {boolean} [options.finite=true] Whether to allow an infinite value as a final result.
     * @param {number} [options.infinity=0] The value to use in the case of an infinite value, if `options.finite` 
     *     is true.
     * @returns {number} The validated value.
     */
    function valuecheck(value, options={}) {
        if (isPercentage(value)) {
            if (isNaN(options.percentageRatio)) options.percentageRatio = 100;
            value = trimlast(value) / options.percentageRatio;
        } else if (typeof value === "string") {
            value = parseFloat(value);
        }
        value = Number(value);

        if (options.min !== undefined) value = Math.max(value, options.min);
        if (options.max !== undefined) value = Math.min(value, options.max);
        if (options.integer)           value = Math.floor(value);

        if (isN(value) || !ifDefined(options.number, true)) value = value;
        else if (isN(options.nan)) value = options.nan;
        else if (isN(options.min)) value = options.min;
        else value = 0;

        if (isFinite(value) || !ifDefined(options.finite, true)) value = value;
        else if (isN(options.infinity)) value = options.infinity;
        else value = 0;

        return value;
    }

    function isN(value) {
        return !isNaN(value);
    }

    function ifDefined(value, newvalue) {
        return value === undefined ? newvalue : value;
    }

    function isDefined(...values) {
        for (let v of values) {
            if (v !== undefined) {
                return true;
            }
        }
        return false;
    }

    function isPercentage(string) {
        return typeof string === "string" && string.endsWith("%");
    }

    function trimlast(string) {
        return string.substring(0, string.length - 1);
    }

    return valuecheck;
})();

class CanvasFont {
    constructor({
        style="",
        variant="",
        weight="",
        //stretch="",
        size="16px",
        lineHeight="",
        family="sans-serif",
    }={}) {
        this.style = style;
        this.weight = weight;
        this.variant = variant;
        //this.stretch = stretch;
        this.size = size;
        this.lineHeight = lineHeight;
        this.family = family;
    }

    toString() {
        let str = "";
        
        str += ([this.style, this.weight, this.variant, /*this.stretch*/].join(" ") + " ").replace(/  +/g, " ");
        str += this.size;
        if (this.lineHeight) {
            str += "/" + this.lineHeight;
        }
        str += " " + (this.family.includes(" ") ? `"${this.family}"` : this.family);

        return str;
    }
}