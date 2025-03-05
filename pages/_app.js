import '../styles/globals.css'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta
          name='description'
          content='게임 타이머 - 게임 중 필요한 알람을 설정하고 공유하는 앱'
        />
        <title>게임 타이머</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
