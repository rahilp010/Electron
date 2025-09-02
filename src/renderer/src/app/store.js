import { configureStore } from '@reduxjs/toolkit'
import electronSlice from './features/electronSlice'

export const store = configureStore({
  reducer: {
    electron: electronSlice
  }
})
