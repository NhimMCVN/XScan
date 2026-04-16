import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { FLUSH, PAUSE, PERSIST, persistReducer, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import { persistStore } from 'redux-persist';
import storage from './config/customeStorage';
import { userApi } from './queries/user.api';
import { challengesApi } from './queries/challenges.api';
import { publicApi } from './queries/public.api';
import { donateApi } from './queries/donate.api';
import { donationLinksApi } from './queries/donationLinks.api';
import { streamerApplicationApi } from './queries/streamerApplication.api';
import { obsApi } from './queries/obs.api';
import { walletApi } from './queries/wallet.api';
import { favoriteStreamersApi } from './queries/favoriteStreamers.api';
import { authReducer } from './slices/auth.slice';

const persistConfig = {
  key: 'root',
  storage,
  blacklist: [
    publicApi.reducerPath,
    donateApi.reducerPath,
    donationLinksApi.reducerPath,
    streamerApplicationApi.reducerPath,
    userApi.reducerPath,
    obsApi.reducerPath,
    challengesApi.reducerPath,
    walletApi.reducerPath,
    favoriteStreamersApi.reducerPath,
  ],
};

const rootReducer = combineReducers({
  auth: authReducer,
  [publicApi.reducerPath]: publicApi.reducer,
  [donateApi.reducerPath]: donateApi.reducer,
  [donationLinksApi.reducerPath]: donationLinksApi.reducer,
  [streamerApplicationApi.reducerPath]: streamerApplicationApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [obsApi.reducerPath]: obsApi.reducer,
  [challengesApi.reducerPath]: challengesApi.reducer,
  [walletApi.reducerPath]: walletApi.reducer,
  [favoriteStreamersApi.reducerPath]: favoriteStreamersApi.reducer,
});

const middlewares = [
  publicApi.middleware,
  donateApi.middleware,
  donationLinksApi.middleware,
  streamerApplicationApi.middleware,
  userApi.middleware,
  obsApi.middleware,
  challengesApi.middleware,
  walletApi.middleware,
  favoriteStreamersApi.middleware,
];

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      immutableCheck: true,
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(middlewares) as any,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const state = store.getState();

export const persistor = persistStore(store);

export default store;
