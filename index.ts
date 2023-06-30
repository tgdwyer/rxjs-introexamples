import { of, range, fromEvent, merge, zip, startWith } from 'rxjs'; 
import { last,filter,scan,map,mergeMap,take, takeUntil } from 'rxjs/operators';

console.log("Observable of parameters:")

of(1,2,3,4)
  .subscribe(console.log)

console.log("Squares of even numbers in the range [0,10):")

range(10)
  .pipe(
    filter(x=>x%2===0),
    map(x=>x*x))
  .subscribe(console.log)

console.log("solution to the first Project Euler problem, the sum of numbers divisible by 3 or 5 under 1000:")

range(1000)
  .pipe(
    filter(x=> x%3===0 || x%5===0),
    scan((a,v)=>a+v),
    last())
  .subscribe(console.log);

console.log("mergeMap of two Observables:")

const 
  columns = of('A','B','C'),
  rows = range(3);

columns.pipe(
  mergeMap(column=>rows.pipe(
    map(row=>[row,column])
  ))
).subscribe(console.log)

console.log("merge of two Observables:")

merge(columns,rows)
  .subscribe(console.log)

zip(columns,rows).subscribe(console.log)

console.log("Asynchronous Observables:")

const 
  key$ = fromEvent<KeyboardEvent>(document,"keydown"),
  mouse$ = fromEvent<MouseEvent>(document,"mousedown");

key$.pipe(
  map(e=>e.key)
).subscribe(console.log)


mouse$.pipe(
  map(_=>"Mouse Click!")
).subscribe(console.log)

merge(key$.pipe(map(e=>e.key)),
      mouse$.pipe(map(_=>"Mouse Click!"))
).subscribe(console.log)

/**
 * Add a drag and drop behaviour to an SVG rectangle.
 * Warning, reading the DOM in the function passed to the first
 * map makes it impure!  See dragrect2 below for the solution.
 */
function dragrect1() {
  const svg = document.getElementById("svgCanvas")!;
  const rect = document.getElementById("draggableRect")!;

  const mousedown = fromEvent<MouseEvent>(rect,'mousedown'),
        mousemove = fromEvent<MouseEvent>(svg,'mousemove'),
        mouseup = fromEvent<MouseEvent>(svg,'mouseup');

  mousedown
    .pipe(
      map(({clientX, clientY}) => ({
        mouseDownXOffset: Number(rect.getAttribute('x')) - clientX,
        mouseDownYOffset: Number(rect.getAttribute('y')) - clientY
      })),
      mergeMap(({mouseDownXOffset, mouseDownYOffset}) =>
        mousemove
          .pipe(
            takeUntil(mouseup),
            map(({clientX, clientY}) => ({
                x: clientX + mouseDownXOffset,
                y: clientY + mouseDownYOffset
              })))))
   .subscribe(({x, y}) => {
     rect.setAttribute('x', String(x))
     rect.setAttribute('y', String(y))
   });
}

/**
 * Tidy up the stream logic such that all state is managed
 * by a pure function passed to scan.
 */
function dragrect2() {
  interface Point { readonly x:number, readonly y:number }
  abstract class MousePosEvent implements Point { 
    readonly x:number; readonly y:number;
    constructor(e:MouseEvent) {
      [this.x,this.y] = [e.clientX, e.clientY]
    } 
  }
  class DownEvent extends MousePosEvent {}
  class DragEvent extends MousePosEvent {}
  type State = Readonly<{
    rect:Point,
    downrect:Point,
    downpos:Point
  }>
  const svg = document.getElementById("svgCanvas")!;
  const rect = document.getElementById("draggableRect")!;

  const mousedown = fromEvent<MouseEvent>(rect,'mousedown'),
        mousemove = fromEvent<MouseEvent>(svg,'mousemove'),
        mouseup = fromEvent<MouseEvent>(svg,'mouseup');
  const initRectPos:Point = {
    x:Number(rect.getAttribute('x')),
    y:Number(rect.getAttribute('y'))
  }

  mousedown
    .pipe(
      mergeMap(mouseDownEvent =>
        mousemove.pipe(
          takeUntil(mouseup),
          map(mouseDragEvent=>new DragEvent(mouseDragEvent)),
          startWith(new DownEvent(mouseDownEvent)))),
      scan((a:State,e:MousePosEvent)=> 
        e instanceof DownEvent
        ? {...a,
            downrect:a.rect,
            downpos:{x:e.x,y:e.y} }
        : {...a,
            rect:{
              x:e.x + a.downrect.x - a.downpos.x,
              y:e.y + a.downrect.y - a.downpos.y} }
      ,<State>{ rect:initRectPos })
    )
   .subscribe(e => {
     rect.setAttribute('x', String(e.rect.x))
     rect.setAttribute('y', String(e.rect.y))
   });
}
dragrect2()