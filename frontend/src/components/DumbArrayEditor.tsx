import { Accessor, Setter, For, JSX } from 'solid-js'

type Props<T> = {
    makeEmpty: () => T,
    array: Accessor<T[]>,
    setArray: Setter<T[]>,
    renderItem: (item: T, index: Accessor<number>) => JSX.Element,
};

export const DumbArrayEditor = <T,>(props: Props<T>) => {
  return (
    <>
        <button onClick={() => {
            const modifiedArray = props.array().slice();
            modifiedArray.push(props.makeEmpty());
            props.setArray(modifiedArray);
        }}>Add</button><br/>
        <For each={props.array()}>
            {(item, i) => {
                return <>
                    <b>{i() + 1}.</b>
                    <button onClick={() => {
                        const arr = props.array().slice();
                        arr.splice(i(), 1);
                        props.setArray(arr);
                    }}>Remove</button>
                    <br/>
                    {props.renderItem(item, i)}
                </>
            }}
        </For>
    </>
  )
}