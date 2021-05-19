import {useEffect , useRef, useState} from "react";
import Paper from '@material-ui/core/Paper';
import {useHistory, useParams} from "react-router";
import useFetch from "../components/useFetch";
import {getCookie, serverAddress, sortBy} from '../components/Utility';
import Typography from '@material-ui/core/Typography';
import { Button, makeStyles } from '@material-ui/core'
// import Button from '@material-ui/core/Button'
import Tweet from "../components/Tweet";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const useStyles = makeStyles({
  root: {
    marginTop: 40,
    margin: 'auto',
    width: '95%',
    maxWidth: 1000,
  },
  thread: {
    width: 1000,
  },
  paper: {
    padding: 20,
    backgroundColor: '#f4f4f4',
    overflowX: 'auto',

    display: 'flex',
    flex: 1,
    boxShadow: 'none',
  },
  title : {
    textAlign: 'center',
    marginBottom: 20,
  },
  threadContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  subTweet: {
    marginLeft: 60,
  }
});

function genTweets(tweet, classes) {
  return (
    <div className={classes.threadContainer}>
      <Tweet tweet={tweet.tweet}/>
      <div className={classes.subTweet}>
        {tweet.replies.map((t) => (
          <div key={t.id}>
            {genTweets(t, classes)}
          </div>
        ))}
      </div>
    </div>
  )
}

function showThread(data, classes) {
  let tweet = JSON.parse(data.thread);
  console.log(tweet)
  return genTweets(tweet, classes)
}

const ViewThread = () => {
  const classes = useStyles();
  const {threadid} = useParams();
  const [target, setTarget] = useState({uri: `${serverAddress}/threads.php`, data: {
    type: 'getThread',
    threadID: threadid
  }});
  const [currentStatus, setCurrentStatus] = useState("");
  const [dummy, setDummy] = useState();
  const serverResponse = useFetch(target);

  const history = useHistory();
  const ref = useRef();

  const [tweets, setTweets] = useState();

  // Check server response
  useEffect(() => {
    if (serverResponse.error.error) {
      setCurrentStatus(serverResponse.error.msg);
      console.log("error")
    }
    else if (serverResponse.data) {
      if (!serverResponse.data.result) {
        setCurrentStatus(serverResponse.data.err);
      }
      else {
        setCurrentStatus("");
        setTweets(showThread(serverResponse.data.thread, classes))
      }
    }
  }, [serverResponse.error, serverResponse.data])

  // Function to save pdf
  const convertToPdf = () => {
    // For mobile
    ref.current.style.width = ref.current.scrollWidth + "px";
    html2canvas(ref.current, {letterRendering: 1, useCORS : true, scrollY: -window.scrollY, scrollX: -window.scrollX ,scale: 2, 
      width: ref.current.scrollWidth
    }).then(canvas => {
      // Convert HTML to png
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm');

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      console.log(`image width, height = (${imgProps.width}, ${imgProps.height})`);

      let posY = 0;
      let heightLeft = pdfHeight
      pdf.addImage(imgData, 'PNG', 0, posY, pdfWidth, pdfHeight, undefined,'FAST');
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        posY = heightLeft - pdfHeight;

        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, posY, pdfWidth, pdfHeight, undefined,'FAST');
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      // pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save("download.pdf"); 
    });
  }

  return (
    <div className={classes.root}>
      <Typography variant="h2" className={classes.title}>
        Thread
      </Typography>

      <Button onClick={convertToPdf}>
        save pdf
      </Button>

      <Paper className={classes.paper} ref={ref}>
        {tweets}
      </Paper>
      <Typography variant="button" color="error">
        {currentStatus}
      </Typography>

      <br/>
      <br/>
    </div>
  );
}
export default ViewThread
