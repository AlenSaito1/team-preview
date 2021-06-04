import Collection from '@discordjs/collection';
import type { PokemonSet } from '@pkmn/sets';
import type { Move } from '@pkmn/data';
import type { Image } from 'skia-canvas';
import type { Stream } from 'stream';
import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import path from 'path';
import { Canvas, loadImage, FontLibrary } from 'skia-canvas';
import GIFEncoder from 'gifencoder';
//@ts-ignore
import extractFrames from 'gif-extract-frames';
import fs from 'fs';

export async function  summaryScreen(data: PokemonSet, options?: { animated: boolean }): Promise<Buffer> {
	FontLibrary.use('gamefont', [
		path.join(__dirname, '../data/font/OpenSans-Semibold.ttf')
	]);

	const canvas = new Canvas(1200, 675),
    ctx = canvas.getContext("2d"),
    { width, height } = canvas;

	const { name, species, pokeball, gender, moves, level, shiny } = data;
	const gens = new Generations(Dex);

	const bg = await loadImage(path.join(__dirname, '../data/images/templates/summary_template.jpg'));

	let movedata: Move[] = [];
	for (const item of moves) {
		movedata.push(gens.get(8).moves.get(item) as Move);
	}
	
	ctx.drawImage(bg, 0, 0);
	ctx.fillStyle = 'white';
	ctx.font = '25px gamefont'
	ctx.fillText(name !== '' ? name : species, 723, 60);
	ctx.fillText(level ? 'Lv. ' + level : '', 963, 60);

	if (pokeball) {
		const ball = await loadImage(path.join(__dirname, `../data/images/icons/balls/${pokeball.replace(' ', '').toLowerCase()}.png`));
		ctx.drawImage(ball, 618, 30, 45, 45);
	} else {
		const ball = await loadImage(path.join(__dirname, '../data/images/icons/balls/pokeball.png'));
		ctx.drawImage(ball, 618, 30, 45, 45);
	}

	if (gender === 'M') {
		const male = await loadImage(path.join(__dirname, '../data/images/icons/genders/male.png'));
		ctx.drawImage(male, 1100, 40);
	} else if (gender === 'F') {
		const female = await loadImage(path.join(__dirname, '../data/images/icons/genders/female.png'));
		ctx.drawImage(female, 1100, 40);
	}

	ctx.fillStyle = 'black';
	ctx.fillText(movedata[0].name, 66, 114);
	ctx.fillText(movedata[1].name, 66, 174);
	ctx.fillText(movedata[2].name, 66, 232);
	ctx.fillText(movedata[3].name, 66, 289);

	const type1 = await loadImage(path.join(__dirname, `../data/images/icons/types/${movedata[0].type.toLowerCase()}.jpg`));
	const type2 = await loadImage(path.join(__dirname, `../data/images/icons/types/${movedata[1].type.toLowerCase()}.jpg`));
	const type3 = await loadImage(path.join(__dirname, `../data/images/icons/types/${movedata[2].type.toLowerCase()}.jpg`));
	const type4 = await loadImage(path.join(__dirname, `../data/images/icons/types/${movedata[3].type.toLowerCase()}.jpg`));

	ctx.drawImage(type1, 320, 92, 125, 28);
	ctx.drawImage(type2, 320, 150, 125, 28);
	ctx.drawImage(type3, 320, 209, 125, 28);
	ctx.drawImage(type4, 320, 267, 125, 28);

	ctx.fillStyle = 'white';
	ctx.fillText(movedata[0].pp + '/' + movedata[0].pp, 480, 114);
	ctx.fillText(movedata[1].pp + '/' + movedata[1].pp, 480, 174);
	ctx.fillText(movedata[2].pp + '/' + movedata[2].pp, 480, 232);
	ctx.fillText(movedata[3].pp + '/' + movedata[3].pp, 480, 289);

	let sprite: Image;
	if (shiny) sprite = await loadImage(`https://play.pokemonshowdown.com/sprites/ani-shiny/${species.toLowerCase()}.gif`);
	else sprite = await loadImage(`https://play.pokemonshowdown.com/sprites/ani/${species.toLowerCase()}.gif`);

	let buffer: Buffer;
	if (options && options.animated) {
		const encoder = new GIFEncoder(width, height);
		let gif = encoder.createReadStream().pipe(fs.createWriteStream('summary.gif'));

		encoder.start();
		encoder.setRepeat(0);
		encoder.setDelay(500);
		encoder.setQuality(10);

		const frames = await extractFrames({
			input: `https://play.pokemonshowdown.com/sprites/ani-shiny/${species.toLowerCase()}.gif`,
		});

		console.log(frames);
		console.log('number of frames', frames.shape[0])

		frames.forEach(async (f: any) => {
			ctx.drawImage(f, 720, 250, sprite.width*3, sprite.height*3);
			encoder.addFrame(ctx);
		}); 

		encoder.finish();
		buffer = await stream2buffer(gif);
	} else {
		ctx.drawImage(sprite, 720, 250, sprite.width*3, sprite.height*3);
		buffer = canvas.toBuffer('jpg');
	}

	return buffer;
}

export async function partyScreen(data: PokemonSet[] | Collection<String, PokemonSet>, options?: { animated: boolean }): Promise<any> {

}

async function stream2buffer( stream: Stream ):Promise<Buffer> {
    return new Promise<Buffer>( (resolve, reject) => {
        let _buf = Array<any>()
    
        stream.on( 'data', chunk => _buf.push(chunk) )
        stream.on( 'end', () => resolve(Buffer.concat(_buf)) )
        stream.on( 'error', err => reject( `error converting stream - ${err}`) )
    })
} 