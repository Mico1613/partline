import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { findBrands, findOffers } from "../store.js";
import { createSearchRunner } from "../searchRunner.js";
export function usePartsSearch() {
  const dispatch = useDispatch();
  const s = useSelector((state) => state.search);
  const brandSearch = useMemo(
    () => createSearchRunner((number) => dispatch(findBrands({ number }))),
    [dispatch],
  );
  useEffect(() => {
    if (s.number.trim()) brandSearch.schedule(s.number.trim());
    return () => brandSearch.cancel();
  }, [s.number, brandSearch]);
  const offerSearch = useMemo(
    () => createSearchRunner((params) => dispatch(findOffers(params))),
    [dispatch],
  );
  useEffect(() => {
    if (s.brand) offerSearch.run({ number: s.number.trim(), brand: s.brand });
    return () => offerSearch.cancel();
  }, [s.brand, s.number, offerSearch]);
  const retryBrands = () => brandSearch.run(s.number.trim());
  const retryOffers = () =>
    offerSearch.run({ number: s.number.trim(), brand: s.brand });
  return { retryBrands, retryOffers };
}
